import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const requiredNonEU = [
  'work_contract', 'transport_licence', 'a1_certificate', 'declaration',
  'insurance', 'travel_insurance', 'visa', 'passport', 'driver_license',
  'medical_certificate', 'psihotest'
];

const requiredEU = [
  'work_contract', 'a1_certificate', 'declaration', 'insurance',
  'passport', 'driver_license', 'medical_certificate', 'psihotest'
];

const readyStatuses = ['valid', 'expiring', 'pending_renewal'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const drivers = await base44.asServiceRole.entities.Driver.list();
    const allDocs = await base44.asServiceRole.entities.DriverDocument.list();

    let updated = 0;

    for (const driver of drivers) {
      const isNonEU = driver.nationality_group === 'non-EU';
      const requiredDocs = isNonEU ? requiredNonEU : requiredEU;
      
      const driverDocs = allDocs.filter(d => d.driver_id === driver.id);

      let readyCount = 0;
      for (const docType of requiredDocs) {
        const doc = driverDocs.find(d => d.document_type === docType);
        if (doc && readyStatuses.includes(doc.status)) {
          readyCount++;
        }
      }

      const readinessPct = Math.round((readyCount / requiredDocs.length) * 100);

      if (driver.trip_readiness_pct !== readinessPct) {
        await base44.asServiceRole.entities.Driver.update(driver.id, {
          trip_readiness_pct: readinessPct
        });
        updated++;
      }
    }

    return Response.json({ 
      success: true,
      updated: updated,
      message: `Updated readiness for ${updated} drivers`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});