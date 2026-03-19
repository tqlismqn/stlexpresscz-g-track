import { base44 } from '@/api/base44Client';

export async function handleNewUserSetup(userEmail, userId) {
  try {
    // Check for pending invitation
    const pendingInvitations = await base44.entities.Invitation.filter({
      email: userEmail,
      status: "pending"
    });

    if (pendingInvitations.length > 0) {
      // SCENARIO B: Invited user joins existing company
      const invitation = pendingInvitations[0];

      const newMembership = await base44.entities.Membership.create({
        user_id: userId,
        company_id: invitation.company_id,
        role_id: invitation.role_id,
        is_owner: false,
        status: "active"
      });

      await base44.entities.Invitation.update(invitation.id, {
        status: "accepted"
      });

      await base44.auth.updateMe({
        last_active_membership_id: newMembership.id
      });

      console.log(`User ${userEmail} joined company ${invitation.company_id} via invitation`);
      return { scenario: 'invited', membership: newMembership };

    } else {
      // SCENARIO A: New tenant
      const newCompany = await base44.entities.Company.create({
        name: "",
        status: "active"
      });

      const adminRoleId = "69bc072930a0257ae94244b2";

      const newMembership = await base44.entities.Membership.create({
        user_id: userId,
        company_id: newCompany.id,
        role_id: adminRoleId,
        is_owner: true,
        status: "active"
      });

      await base44.auth.updateMe({
        last_active_membership_id: newMembership.id
      });

      console.log(`New tenant created for ${userEmail}: company=${newCompany.id}`);
      return { scenario: 'new_tenant', membership: newMembership, company: newCompany };
    }

  } catch (error) {
    console.error('Error in handleNewUserSetup:', error);
    throw error;
  }
}