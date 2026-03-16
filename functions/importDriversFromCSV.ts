import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const visaTypeMap = {
  'Povoleni k pobytu': 'povoleni_k_pobytu',
  'Vizum': 'vizum',
  'Dočasná ochrana': 'docasna_ochrana',
  'Trvaly pobyt': 'trvaly_pobyt',
  'Vízum strpění': 'vizum_strpeni',
  'Trvaly pobyt -Dočasná ochrana': 'trvaly_pobyt'
};

const isValidDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const trimmed = dateStr.trim();
  if (!trimmed || trimmed === 'indefinite' || trimmed.startsWith('pending:')) return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  return regex.test(trimmed);
};

const parseDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;
  if (trimmed === 'indefinite') return null;
  if (trimmed.startsWith('pending:')) {
    return trimmed.substring(8);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
};

const parseDocumentStatus = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return 'valid';
  const trimmed = dateStr.trim();
  if (trimmed.startsWith('pending:')) return 'pending_renewal';
  return 'valid';
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get company
    const companies = await base44.asServiceRole.entities.Company.list();
    const stlExpress = companies.find(c => c.name === 'STL Express');
    
    if (!stlExpress) {
      return Response.json({ error: 'Company STL Express not found' }, { status: 400 });
    }

    const csvData = await req.text();
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const drivers = [];
    const driverDocuments = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const values = line.split(',').map(v => v.trim());
      const row = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });

      // Create driver record
      const driver = {
        name: row.driver_name,
        company_id: stlExpress.id,
        status: row.driver_status === 'active' ? 'active' : 'inactive',
        nationality_group: row.nationality_group,
        date_of_birth: row.date_of_birth || null,
        phone: row.phone || null,
        email: row.email || null,
        passport_number: row.passport_number || null,
        driving_license_number: row.driving_license_number || null,
        rodne_cislo: row.rodne_cislo || null,
        address: row.propiska_address || null,
        bank_name: row.bank || null,
        bank_account: row.iban || null,
        trip_readiness_pct: 0
      };

      // Handle fired dates
      if (row.fired_date && isValidDate(row.fired_date)) {
        driver.fired_date = row.fired_date;
      }
      if (row.fired_reason) {
        driver.fired_reason = row.fired_reason;
      }

      // Handle visa type
      if (row.visa_type && visaTypeMap[row.visa_type]) {
        driver.visa_type = visaTypeMap[row.visa_type];
      }

      drivers.push(driver);
    }

    // Bulk create drivers
    const createdDrivers = await base44.asServiceRole.entities.Driver.bulkCreate(drivers);
    
    // Now create DriverDocument records
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const values = line.split(',').map(v => v.trim());
      const row = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });

      const driverId = createdDrivers[i - 1].id;
      const isNonEU = row.nationality_group === 'non-EU';

      // work_contract
      if (row.contract_start || row.contract_end) {
        const startDate = parseDate(row.contract_start);
        const endDate = row.contract_end === 'indefinite' ? null : parseDate(row.contract_end);
        const status = row.contract_end === 'indefinite' ? 'valid' : 'valid';
        driverDocuments.push({
          driver_id: driverId,
          document_type: 'work_contract',
          issue_date: startDate,
          expiry_date: endDate,
          status: status
        });
      }

      // transport_licence
      if (row.licence_start || row.licence_end) {
        const startDate = parseDate(row.licence_start);
        const endDate = parseDate(row.licence_end);
        if (startDate || endDate) {
          driverDocuments.push({
            driver_id: driverId,
            document_type: 'transport_licence',
            issue_date: startDate,
            expiry_date: endDate,
            status: 'valid'
          });
        }
      }

      // a1_certificate
      if (row.a1_start || row.a1_end) {
        const startDate = parseDate(row.a1_start);
        const endDate = parseDate(row.a1_end);
        if (startDate || endDate) {
          driverDocuments.push({
            driver_id: driverId,
            document_type: 'a1_certificate',
            issue_date: startDate,
            expiry_date: endDate,
            status: 'valid'
          });
        }
      }

      // declaration
      if (row.declaration_end) {
        const endDate = parseDate(row.declaration_end);
        if (endDate) {
          driverDocuments.push({
            driver_id: driverId,
            document_type: 'declaration',
            expiry_date: endDate,
            status: 'valid'
          });
        }
      }

      // insurance
      if (row.insurance_end) {
        const endDate = parseDate(row.insurance_end);
        if (endDate) {
          driverDocuments.push({
            driver_id: driverId,
            document_type: 'insurance',
            expiry_date: endDate,
            status: 'valid'
          });
        }
      }

      // visa (skip for EU drivers if empty)
      if (row.visa_end && (isNonEU || row.visa_end)) {
        const endDate = parseDate(row.visa_end);
        if (endDate) {
          driverDocuments.push({
            driver_id: driverId,
            document_type: 'visa',
            expiry_date: endDate,
            status: 'valid'
          });
        }
      }

      // passport
      if (row.passport_end) {
        const endDate = parseDate(row.passport_end);
        if (endDate) {
          driverDocuments.push({
            driver_id: driverId,
            document_type: 'passport',
            expiry_date: endDate,
            document_number: row.passport_number,
            status: 'valid'
          });
        }
      }

      // driver_license
      if (row.driving_license_end) {
        const endDate = parseDate(row.driving_license_end);
        if (endDate) {
          driverDocuments.push({
            driver_id: driverId,
            document_type: 'driver_license',
            expiry_date: endDate,
            document_number: row.driving_license_number,
            status: 'valid'
          });
        }
      }

      // adr_certificate
      if (row.adr_end) {
        const endDate = parseDate(row.adr_end);
        if (endDate) {
          driverDocuments.push({
            driver_id: driverId,
            document_type: 'adr_certificate',
            expiry_date: endDate,
            status: 'valid'
          });
        }
      }

      // chip_card
      if (row.chip_end) {
        const endDate = parseDate(row.chip_end);
        if (endDate) {
          driverDocuments.push({
            driver_id: driverId,
            document_type: 'chip_card',
            expiry_date: endDate,
            document_number: row.chip_number || null,
            status: 'valid'
          });
        }
      }

      // code95
      if (row.code95_end) {
        const endDate = parseDate(row.code95_end);
        if (endDate) {
          driverDocuments.push({
            driver_id: driverId,
            document_type: 'code95',
            expiry_date: endDate,
            status: 'valid'
          });
        }
      }

      // medical_certificate
      if (row.medical_start || row.medical_end) {
        const startDate = parseDate(row.medical_start);
        const endDate = parseDate(row.medical_end);
        if (startDate || endDate) {
          driverDocuments.push({
            driver_id: driverId,
            document_type: 'medical_certificate',
            issue_date: startDate,
            expiry_date: endDate,
            status: 'valid'
          });
        }
      }

      // psihotest
      if (row.psiholog_date) {
        const startDate = parseDate(row.psiholog_date);
        if (startDate) {
          driverDocuments.push({
            driver_id: driverId,
            document_type: 'psihotest',
            issue_date: startDate,
            status: 'valid'
          });
        }
      }
    }

    // Bulk create documents
    if (driverDocuments.length > 0) {
      await base44.asServiceRole.entities.DriverDocument.bulkCreate(driverDocuments);
    }

    // Compute document statuses and driver readiness
    await base44.asServiceRole.functions.invoke('computeDocumentStatus', {});
    await base44.asServiceRole.functions.invoke('computeDriverReadiness', {});

    return Response.json({
      success: true,
      drivers_created: createdDrivers.length,
      documents_created: driverDocuments.length
    });
  } catch (error) {
    console.error('Import error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});