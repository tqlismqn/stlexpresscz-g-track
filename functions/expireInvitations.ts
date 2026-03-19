import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const now = new Date().toISOString();

        const expiredInvitations = await base44.asServiceRole.entities.Invitation.filter({
            status: "pending",
            expires_at: { "$lt": now }
        });

        let updatedCount = 0;
        for (const invitation of expiredInvitations) {
            await base44.asServiceRole.entities.Invitation.update(invitation.id, {
                status: "expired"
            });
            updatedCount++;
            console.log(`Expired invitation ${invitation.id} for ${invitation.email}`);
        }

        return Response.json({
            success: true,
            checked: expiredInvitations.length,
            expired: updatedCount,
            message: `Found and expired ${updatedCount} invitations.`
        });

    } catch (error) {
        console.error('Error in expireInvitations:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});