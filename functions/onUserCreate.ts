import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const payload = await req.json();
        const newUser = payload.data;

        if (!newUser || !newUser.id || !newUser.email) {
            console.error('Invalid user data received:', payload);
            return Response.json({ error: 'Invalid user data' }, { status: 400 });
        }

        // Check for pending invitation
        const pendingInvitations = await base44.asServiceRole.entities.Invitation.filter({
            email: newUser.email,
            status: "pending"
        });

        if (pendingInvitations.length > 0) {
            // SCENARIO B: Invited user joins existing company
            const invitation = pendingInvitations[0];

            const newMembership = await base44.asServiceRole.entities.Membership.create({
                user_id: newUser.id,
                company_id: invitation.company_id,
                role_id: invitation.role_id,
                is_owner: false,
                status: "active"
            });

            await base44.asServiceRole.entities.Invitation.update(invitation.id, {
                status: "accepted"
            });

            await base44.asServiceRole.entities.User.update(newUser.id, {
                last_active_membership_id: newMembership.id
            });

            console.log(`User ${newUser.email} joined company ${invitation.company_id} via invitation`);
            return Response.json({ success: true, scenario: 'invited' });

        } else {
            // SCENARIO A: New tenant — create company + owner membership
            const newCompany = await base44.asServiceRole.entities.Company.create({
                name: "",
                status: "active"
            });

            // Template admin role ID
            const adminRoleId = "69bc072930a0257ae94244b2";

            const newMembership = await base44.asServiceRole.entities.Membership.create({
                user_id: newUser.id,
                company_id: newCompany.id,
                role_id: adminRoleId,
                is_owner: true,
                status: "active"
            });

            await base44.asServiceRole.entities.User.update(newUser.id, {
                last_active_membership_id: newMembership.id
            });

            console.log(`New tenant created for ${newUser.email}: company=${newCompany.id}`);
            return Response.json({ success: true, scenario: 'new_tenant', company_id: newCompany.id });
        }

    } catch (error) {
        console.error('Error in onUserCreate:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});