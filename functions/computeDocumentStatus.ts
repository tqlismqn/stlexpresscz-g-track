import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const computeDocStatus = (doc) => {
  if (!doc.expiry_date) {
    return 'valid';
  }

  const expiryDate = new Date(doc.expiry_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let thresholdDays = 30;
  if (doc.document_type === 'visa' && doc.visa_type === 'povoleni_k_pobytu') {
    thresholdDays = 90;
  }

  const thresholdDate = new Date(today);
  thresholdDate.setDate(thresholdDate.getDate() + thresholdDays);

  if (expiryDate < today) {
    return 'expired';
  } else if (expiryDate < thresholdDate) {
    return 'expiring';
  } else {
    return 'valid';
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allDocs = await base44.asServiceRole.entities.DriverDocument.list();
    
    let updated = 0;
    for (const doc of allDocs) {
      const newStatus = computeDocStatus(doc);
      if (doc.status !== newStatus) {
        await base44.asServiceRole.entities.DriverDocument.update(doc.id, {
          status: newStatus
        });
        updated++;
      }
    }

    return Response.json({ 
      success: true,
      updated: updated,
      message: `Updated ${updated} document statuses`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});