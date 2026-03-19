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
  const [loading, setLoading] = useState(true);
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
          setLoading(false);
          return;
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

        // 3. Fetch Role to get permissions
        if (active?.role_id) {
          const roleData = await base44.entities.Role.get(active.role_id);
          setRole(roleData);
          setPermissions(roleData.permissions || []);
        }

        // 4. Fetch Company to get company name
        if (active?.company_id) {
          try {
            const companyData = await base44.entities.Company.get(active.company_id);
            setCompany(companyData);
          } catch (e) {
            console.error('MembershipContext: Failed to fetch company', e);
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

      // Update user's last_active_membership_id
      await base44.auth.updateMe({ last_active_membership_id: membershipId });

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

  const value = {
    activeMembership,
    allMemberships,
    role,
    permissions,
    company,
    companyName: company?.name || '',
    isOwner: activeMembership?.is_owner === true,
    companyId: activeMembership?.company_id || null,
    loading,
    switchCompany,
    hasMultipleCompanies: allMemberships.length > 1,
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