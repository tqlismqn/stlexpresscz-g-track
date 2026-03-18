import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Load all drivers and tags
    const [drivers, tags] = await Promise.all([
        base44.asServiceRole.entities.Driver.list(),
        base44.asServiceRole.entities.DriverTag.list(),
    ]);

    const tagByTagId = {};
    for (const tag of tags) {
        tagByTagId[tag.tag_id] = tag.id;
    }

    const counts = { terminated: 0, on_leave: 0, inactive: 0, active: 0, errors: 0 };
    const errors = [];

    for (const driver of drivers) {
        try {
            const oldStatus = driver.status;

            if (oldStatus === 'active') {
                counts.active++;
                continue;
            }

            let update = {};

            if (oldStatus === 'terminated') {
                const tagId = tagByTagId['fired'];
                update = {
                    status: 'archived',
                    archive_reason_tag_id: tagId,
                    tags: [...(driver.tags || []), tagId],
                };
                counts.terminated++;
            } else if (oldStatus === 'on_leave') {
                const tagId = tagByTagId['on_leave'];
                update = {
                    status: 'active',
                    tags: [...(driver.tags || []), tagId],
                };
                counts.on_leave++;
            } else if (oldStatus === 'inactive') {
                const tagId = tagByTagId['resigned'];
                update = {
                    status: 'archived',
                    archive_reason_tag_id: tagId,
                    tags: [...(driver.tags || []), tagId],
                };
                counts.inactive++;
            } else {
                // unknown status — skip
                continue;
            }

            await base44.asServiceRole.entities.Driver.update(driver.id, update);
        } catch (err) {
            counts.errors++;
            errors.push({ driver_id: driver.id, name: driver.name, error: err.message });
            console.error(`Failed to migrate driver ${driver.id} (${driver.name}):`, err.message);
        }
    }

    const summary = `Terminated → Archived: ${counts.terminated}, On Leave → Active: ${counts.on_leave}, Inactive → Archived: ${counts.inactive}, Active unchanged: ${counts.active}, Errors: ${counts.errors}`;
    console.log('Migration complete:', summary);

    return Response.json({ success: true, summary, counts, errors });
});