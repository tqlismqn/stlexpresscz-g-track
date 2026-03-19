const DOCUMENT_TYPES = [
  'work_contract',
  'transport_licence',
  'a1_certificate',
  'declaration',
  'insurance',
  'visa',
  'passport',
  'driver_license',
  'medical_certificate',
  'psihotest',
  'adr_certificate',
  'chip_card',
  'code95',
];

function escapeCSV(value) {
  const str = value == null ? '' : String(value);
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function formatDate(iso) {
  if (!iso) return '';
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return iso;
  return `${match[3]}.${match[2]}.${match[1]}`;
}

function buildRow(values) {
  return values.map(escapeCSV).join(';');
}

export function generateCSV(drivers, allDocuments, templateKey, t) {
  // Group documents by driver_id, only current (non-previous) docs
  const docsByDriver = new Map();
  allDocuments.forEach(doc => {
    if (doc.is_previous === true) return;
    if (!docsByDriver.has(doc.driver_id)) docsByDriver.set(doc.driver_id, []);
    docsByDriver.get(doc.driver_id).push(doc);
  });

  // For each driver, get the newest doc per type
  const getCurrentDoc = (driverDocs, docType) => {
    const matching = (driverDocs || []).filter(d => d.document_type === docType);
    if (!matching.length) return null;
    return matching.sort((a, b) => {
      const aDate = a.expiry_date || a.issue_date || a.created_date || '';
      const bDate = b.expiry_date || b.issue_date || b.created_date || '';
      return bDate > aDate ? 1 : -1;
    })[0];
  };

  let headers = [];
  let rows = [];

  if (templateKey === 'driver_list') {
    headers = [
      t('export.internal_number'),
      t('export.full_name'),
      t('export.status'),
      t('export.nationality_group'),
      t('export.country_code'),
      t('export.phone'),
      t('export.email'),
      t('export.readiness'),
      t('export.tags'),
    ];

    rows = drivers.map(driver => {
      const name = driver.name || '';
      const status = driver.status || '';
      const tags = Array.isArray(driver.tags) ? driver.tags.join(', ') : '';

      return buildRow([
        driver.internal_number != null ? `DRV-${String(driver.internal_number).padStart(3, '0')}` : '',
        name,
        status,
        driver.nationality_group || '',
        driver.country_code || '',
        driver.phone || '',
        driver.email || '',
        driver.trip_readiness_pct != null ? `${driver.trip_readiness_pct}%` : '',
        tags,
      ]);
    });

  } else if (templateKey === 'document_statuses') {
    headers = [
      t('export.internal_number'),
      t('export.full_name'),
      ...DOCUMENT_TYPES.map(dt => t(`doc_types.${dt}`, { defaultValue: dt })),
    ];

    rows = drivers.map(driver => {
      const driverDocs = docsByDriver.get(driver.id) || [];
      const docCells = DOCUMENT_TYPES.map(docType => {
        const doc = getCurrentDoc(driverDocs, docType);
        if (!doc) return 'missing';
        let status = doc.status || 'missing';
        if (doc.return_status === 'pending_return') {
          status += ' (pending return)';
        }
        return status;
      });

      return buildRow([
        driver.internal_number != null ? `DRV-${String(driver.internal_number).padStart(3, '0')}` : '',
        driver.name || '',
        ...docCells,
      ]);
    });

  } else if (templateKey === 'document_expiry') {
    headers = [
      t('export.internal_number'),
      t('export.full_name'),
      ...DOCUMENT_TYPES.map(dt => t(`doc_types.${dt}`, { defaultValue: dt })),
    ];

    rows = drivers.map(driver => {
      const driverDocs = docsByDriver.get(driver.id) || [];
      const docCells = DOCUMENT_TYPES.map(docType => {
        const doc = getCurrentDoc(driverDocs, docType);
        if (!doc || !doc.expiry_date) return '';
        return formatDate(doc.expiry_date);
      });

      return buildRow([
        driver.internal_number != null ? `DRV-${String(driver.internal_number).padStart(3, '0')}` : '',
        driver.name || '',
        ...docCells,
      ]);
    });
  }

  const csvLines = [buildRow(headers), ...rows];
  return '\uFEFF' + csvLines.join('\n');
}

export function downloadCSV(csvString, templateKey) {
  const today = new Date().toISOString().slice(0, 10);
  const filename = `g-track_${templateKey}_${today}.csv`;
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}