import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { handleNewUserSetup } from '@/lib/userSetup';

const MembershipContext = createContext(null);

export function MembershipProvider({ children }) {
  const { currentUser } = useAuth();
  const [activeMembership, setActiveMembership] = useState(null);
  const [allMemberships, setAllMemberships] = useState([]);
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [company, setCompany] = useState(null);
  const [companiesMap, setCompaniesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const setupCompleted = useRef(false);

  // Load memberships when user changes
  useEffect(() => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }

    async function loadMembership() {
      try {
        setLoading(true);

        // 1. Fetch all memberships for this user
        const memberships = await base44.entities.Membership.filter({ user_id: currentUser.id });
        const activeMemberships = memberships.filter(m => m.status === 'active');
        setAllMemberships(activeMemberships);

        if (activeMemberships.length === 0) {
          // New user — run setup only once
          if (!setupCompleted.current) {
            setupCompleted.current = true;
            try {
              await handleNewUserSetup(currentUser.email, currentUser.id);
              // Re-fetch memberships after setup
              const updatedMemberships = await base44.entities.Membership.filter({ user_id: currentUser.id });
              const updatedActiveMemberships = updatedMemberships.filter(m => m.status === 'active');
              setAllMemberships(updatedActiveMemberships);
              
              if (updatedActiveMemberships.length === 0) {
                setLoading(false);
                return;
              }
            } catch (setupError) {
              console.error('MembershipContext: New user setup failed', setupError);
              setLoading(false);
              return;
            }
          } else {
            setLoading(false);
            return;
          }
        }

        // 2. Find active membership (by last_active_membership_id or first)
        let active = null;
        if (currentUser.last_active_membership_id) {
          active = activeMemberships.find(m => m.id === currentUser.last_active_membership_id);
        }
        if (!active) {
          active = activeMemberships[0];
        }
        setActiveMembership(active);

        // 2a. Sync User.company_id with active membership if needed
        if (active && currentUser.company_id !== active.company_id) {
          await base44.auth.updateMe({ company_id: active.company_id });
        }

        // 3. Fetch Role to get permissions
        if (active?.role_id) {
          const roleData = await base44.entities.Role.get(active.role_id);
          setRole(roleData);
          setPermissions(roleData.permissions || []);
        }

        // 4. Fetch Company data for active membership + all other memberships
        const newCompaniesMap = {};
        if (active?.company_id) {
          try {
            const companyData = await base44.entities.Company.get(active.company_id);
            setCompany(companyData);
            newCompaniesMap[active.company_id] = companyData;
          } catch (e) {
            console.error('MembershipContext: Failed to fetch company', e);
          }
        }
        
        // Fetch company names for other memberships
        for (const membership of activeMemberships) {
          if (membership.company_id && !newCompaniesMap[membership.company_id]) {
            try {
              const companyData = await base44.entities.Company.get(membership.company_id);
              newCompaniesMap[membership.company_id] = companyData;
            } catch (e) {
              console.error('MembershipContext: Failed to fetch company for membership', membership.id, e);
            }
          }
        }
        setCompaniesMap(newCompaniesMap);

        // 5. Fetch pending invitations for this user's email
        if (currentUser.email) {
          try {
            const invites = await base44.entities.Invitation.filter({ email: currentUser.email, status: 'pending' });
            setPendingInvitations(invites || []);
          } catch (e) {
            setPendingInvitations([]);
          }
        }
      } catch (error) {
        console.error('MembershipContext: Failed to load membership', error);
      } finally {
        setLoading(false);
      }
    }

    loadMembership();
  }, [currentUser?.id]);

  // Switch company (for multi-tenant)
  const switchCompany = useCallback(async (membershipId) => {
    try {
      setLoading(true);
      const target = allMemberships.find(m => m.id === membershipId);
      if (!target) return;

      // Update user's last_active_membership_id and company_id
      await base44.auth.updateMe({ last_active_membership_id: membershipId, company_id: target.company_id });

      // Update local state
      setActiveMembership(target);

      // Fetch new role
      if (target.role_id) {
        const roleData = await base44.entities.Role.get(target.role_id);
        setRole(roleData);
        setPermissions(roleData.permissions || []);
      }

      // Fetch new company
      if (target.company_id) {
        try {
          const companyData = await base44.entities.Company.get(target.company_id);
          setCompany(companyData);
        } catch (e) {
          console.error('MembershipContext: Failed to fetch company', e);
        }
      }
    } catch (error) {
      console.error('MembershipContext: Failed to switch company', error);
    } finally {
      setLoading(false);
    }
  }, [allMemberships]);

  const refreshInvitations = useCallback(async () => {
    if (!currentUser?.email) return;
    try {
      const invites = await base44.entities.Invitation.filter({ email: currentUser.email, status: 'pending' });
      setPendingInvitations(invites || []);
    } catch (e) {
      console.error('Failed to fetch invitations:', e);
      setPendingInvitations([]);
    }
  }, [currentUser?.email]);

  const acceptInvitation = useCallback(async (invitation) => {
    // Step 1: Temporarily switch user's company_id to bypass RLS for Company B
    await base44.auth.updateMe({ company_id: invitation.company_id });

    // Step 2: Now create Membership (RLS passes because user.company_id matches)
    const newMembership = await base44.entities.Membership.create({
      user_id: currentUser.id,
      company_id: invitation.company_id,
      role_id: invitation.role_id,
      is_owner: false,
      status: 'active',
      user_full_name: currentUser.full_name || currentUser.display_name || currentUser.email,
      user_email: currentUser.email,
    });

    // Step 3: Update Invitation status (RLS now passes too)
    await base44.entities.Invitation.update(invitation.id, { status: 'accepted' });

    // Step 4: Refresh memberships
    const updatedMemberships = await base44.entities.Membership.filter({ user_id: currentUser.id });
    const activeMemberships = updatedMemberships.filter(m => m.status === 'active');
    setAllMemberships(activeMemberships);
    await refreshInvitations();

    // Step 5: Switch to new company (also updates User.company_id permanently)
    await switchCompany(newMembership.id);

    return newMembership;
  }, [currentUser, refreshInvitations, switchCompany]);

  const declineInvitation = useCallback(async (invitation) => {
    await base44.entities.Invitation.update(invitation.id, { status: 'declined' });
    await refreshInvitations();
  }, [refreshInvitations]);

  const value = {
    activeMembership,
    allMemberships,
    role,
    permissions,
    company,
    companyName: company?.name || '',
    companiesMap,
    isOwner: activeMembership?.is_owner === true,
    companyId: activeMembership?.company_id || null,
    loading,
    switchCompany,
    hasMultipleCompanies: allMemberships.length > 1,
    pendingInvitations,
    refreshInvitations,
    acceptInvitation,
    declineInvitation,
  };

  return (
    <MembershipContext.Provider value={value}>
      {children}
    </MembershipContext.Provider>
  );
}

export function useMembership() {
  const context = useContext(MembershipContext);
  if (!context) {
    throw new Error('useMembership must be used within MembershipProvider');
  }
  return context;
}

export default MembershipContext;