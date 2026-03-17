import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const existing = await base44.asServiceRole.entities.Company.filter({ name: 'STL Express' });
    if (existing && existing.length > 0) {
      return Response.json({ 
        success: true, 
        company: existing[0],
        message: 'Company initialized'
      });
    }

    const company = await base44.asServiceRole.entities.Company.create({
      name: 'STL Express',
      slug: 'stl-express',
      settings: {
        currency: 'CZK',
        date_format: 'DD.MM.YYYY'
      }
    });

    return Response.json({ 
      success: true, 
      company: company,
      message: 'Company initialized'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});