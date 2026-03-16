import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const csvText = body.csv;

    if (!csvText) {
      return Response.json({ error: 'CSV data required' }, { status: 400 });
    }

    // Get company ID
    const companies = await base44.asServiceRole.entities.Company.list();
    const stlExpress = companies.find(c => c.name === 'STL Express');

    if (!stlExpress) {
      return Response.json({ error: 'STL Express company not found' }, { status: 400 });
    }

    // Parse CSV
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    const drivers = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      // Simple CSV parsing (handles quoted fields)
      const values = [];
      let current = '';
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current);

      const driver = { company_id: stlExpress.id };
      for (let j = 0; j < headers.length; j++) {
        const header = headers[j].trim();
        const value = values[j]?.trim() || '';
        if (value && header !== 'trip_readiness_pct') {
          driver[header] = value;
        }
      }

      if (driver.name) {
        drivers.push(driver);
      }
    }

    // Bulk create in chunks
    const chunkSize = 50;
    let created = 0;

    for (let i = 0; i < drivers.length; i += chunkSize) {
      const chunk = drivers.slice(i, i + chunkSize);
      const result = await base44.asServiceRole.entities.Driver.bulkCreate(chunk);
      created += result.length;
    }

    return Response.json({
      success: true,
      imported: created,
      message: `Successfully imported ${created} drivers`
    });
  } catch (error) {
    console.error('Import error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});