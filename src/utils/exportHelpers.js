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

// ─── PDF export ───────────────────────────────────────────────────────────────

export async function generateAndDownloadPDF(drivers, allDocuments, templateKey, t) {
  const { default: jsPDF } = await import('jspdf');
  const { default: html2canvas } = await import('html2canvas');

  const TEMPLATE_NAMES = {
    driver_list: t('export.driver_list'),
    document_statuses: t('export.document_statuses'),
    document_expiry: t('export.document_expiry'),
  };

  const DOC_TYPE_LABELS = {};
  DOCUMENT_TYPES.forEach(dt => {
    DOC_TYPE_LABELS[dt] = t(`doc_types.${dt}`, { defaultValue: dt });
  });

  // Step 1: Prepare data
  const docsByDriver = new Map();
  allDocuments.forEach(doc => {
    if (doc.is_previous === true) return;
    if (!docsByDriver.has(doc.driver_id)) docsByDriver.set(doc.driver_id, []);
    docsByDriver.get(doc.driver_id).push(doc);
  });

  const getCurrentDoc = (driverDocs, docType) => {
    const matching = (driverDocs || []).filter(d => d.document_type === docType);
    if (!matching.length) return null;
    return matching.sort((a, b) => {
      const aDate = a.expiry_date || a.issue_date || a.created_date || '';
      const bDate = b.expiry_date || b.issue_date || b.created_date || '';
      return bDate > aDate ? 1 : -1;
    })[0];
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return iso;
    return `${match[3]}.${match[2]}.${match[1]}`;
  };

  let headers = [];
  let rows = [];

  if (templateKey === 'driver_list') {
    headers = [t('export.internal_number'), t('export.full_name'), t('export.status'), t('export.nationality_group'), t('export.country_code'), t('export.phone'), t('export.email'), t('export.readiness'), t('export.tags')];
    rows = drivers.map(driver => [
      driver.internal_number != null ? `DRV-${String(driver.internal_number).padStart(3, '0')}` : '',
      driver.name || '',
      driver.status || '',
      driver.nationality_group || '',
      driver.country_code || '',
      driver.phone || '',
      driver.email || '',
      driver.trip_readiness_pct != null ? `${driver.trip_readiness_pct}%` : '',
      Array.isArray(driver.tags) ? driver.tags.join(', ') : '',
    ]);
  } else if (templateKey === 'document_statuses') {
    headers = [t('export.internal_number'), t('export.full_name'), ...DOCUMENT_TYPES.map(dt => DOC_TYPE_LABELS[dt] || dt)];
    rows = drivers.map(driver => {
      const driverDocs = docsByDriver.get(driver.id) || [];
      const docCells = DOCUMENT_TYPES.map(docType => {
        const doc = getCurrentDoc(driverDocs, docType);
        if (!doc) return 'missing';
        let status = doc.status || 'missing';
        if (doc.return_status === 'pending_return') status += ' (pending)';
        return status;
      });
      return [
        driver.internal_number != null ? `DRV-${String(driver.internal_number).padStart(3, '0')}` : '',
        driver.name || '',
        ...docCells,
      ];
    });
  } else if (templateKey === 'document_expiry') {
    headers = [t('export.internal_number'), t('export.full_name'), ...DOCUMENT_TYPES.map(dt => DOC_TYPE_LABELS[dt] || dt)];
    rows = drivers.map(driver => {
      const driverDocs = docsByDriver.get(driver.id) || [];
      const docCells = DOCUMENT_TYPES.map(docType => {
        const doc = getCurrentDoc(driverDocs, docType);
        if (!doc || !doc.expiry_date) return '';
        return formatDate(doc.expiry_date);
      });
      return [
        driver.internal_number != null ? `DRV-${String(driver.internal_number).padStart(3, '0')}` : '',
        driver.name || '',
        ...docCells,
      ];
    });
  }

  // Step 2: Create hidden container
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;background:white;padding:20px;width:1400px;';
  document.body.appendChild(container);

  // Step 3: Build HTML table
  const templateName = TEMPLATE_NAMES[templateKey] || templateKey;
  const title = `G-Track — ${templateName}`;
  const subtitle = `Exported: ${new Date().toLocaleDateString('cs-CZ')} • ${drivers.length} drivers`;

  let html = `<div style="font-family:Arial,sans-serif;">`;
  html += `<h2 style="margin:0 0 4px 0;font-size:18px;color:#1e3a5f;">${title}</h2>`;
  html += `<p style="margin:0 0 12px 0;font-size:11px;color:#6b7280;">${subtitle}</p>`;
  html += `<table style="border-collapse:collapse;width:100%;font-size:10px;">`;
  html += `<thead><tr>`;
  headers.forEach(h => {
    html += `<th style="border:1px solid #d1d5db;padding:6px 8px;background:#3b82f6;color:white;font-weight:600;text-align:left;white-space:nowrap;">${h}</th>`;
  });
  html += `</tr></thead><tbody>`;
  rows.forEach((row, rowIndex) => {
    const bgColor = rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc';
    html += `<tr>`;
    row.forEach((cell, colIndex) => {
      let cellStyle = `border:1px solid #e5e7eb;padding:5px 8px;background:${bgColor};`;
      if (templateKey === 'document_statuses' && colIndex >= 2) {
        const val = (cell || '').toLowerCase();
        if (val === 'valid') cellStyle = `border:1px solid #d1d5db;padding:5px 8px;background:#dcfce7;color:#166534;font-weight:600;`;
        else if (val === 'expiring') cellStyle = `border:1px solid #d1d5db;padding:5px 8px;background:#ffedd5;color:#9a3412;font-weight:600;`;
        else if (val === 'expired') cellStyle = `border:1px solid #d1d5db;padding:5px 8px;background:#fee2e2;color:#991b1b;font-weight:600;`;
        else if (val.startsWith('missing')) cellStyle = `border:1px solid #d1d5db;padding:5px 8px;background:#f3f4f6;color:#6b7280;`;
      }
      html += `<td style="${cellStyle}">${cell || ''}</td>`;
    });
    html += `</tr>`;
  });
  html += `</tbody></table></div>`;
  container.innerHTML = html;

  // Step 4: Render with html2canvas
  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  // Step 5: Create PDF and embed image
  const imgData = canvas.toDataURL('image/png');
  const imgWidth = 287;
  const pageHeight = 190;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  let heightLeft = imgHeight;
  let position = 5;
  let page = 1;

  pdf.addImage(imgData, 'PNG', 5, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    pdf.addPage();
    page++;
    position = 5 - (page - 1) * pageHeight;
    pdf.addImage(imgData, 'PNG', 5, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(156, 163, 175);
    pdf.text(`Page ${i} of ${totalPages}`, 290, 205, { align: 'right' });
    pdf.text('G-Track TMS', 5, 205);
  }

  // Step 6: Cleanup and download
  document.body.removeChild(container);
  const filename = `g-track_${templateKey}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
}