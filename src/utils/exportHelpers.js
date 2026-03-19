import jsPDF from 'jspdf';

const DOCUMENT_TYPES = [
  'work_contract', 'transport_licence', 'a1_certificate', 'declaration',
  'insurance', 'visa', 'passport', 'driver_license', 'medical_certificate',
  'psihotest', 'adr_certificate', 'chip_card', 'code95',
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

function getDocsByDriver(allDocuments) {
  const map = new Map();
  allDocuments.forEach(doc => {
    if (!map.has(doc.driver_id)) map.set(doc.driver_id, []);
    map.get(doc.driver_id).push(doc);
  });
  return map;
}

function getCurrentDoc(driverDocs, docType) {
  const matching = (driverDocs || []).filter(d => d.document_type === docType);
  if (!matching.length) return null;
  return matching.sort((a, b) => {
    const aDate = a.expiry_date || a.issue_date || a.created_date || '';
    const bDate = b.expiry_date || b.issue_date || b.created_date || '';
    return bDate > aDate ? 1 : -1;
  })[0];
}

export function generateCSV(drivers, allDocuments, templateKey, t) {
  const docsByDriver = getDocsByDriver(allDocuments);
  let headers = [];
  let rows = [];

  if (templateKey === 'driver_list') {
    headers = [
      t('export.internal_number'), t('export.full_name'), t('export.status'),
      t('export.nationality_group'), t('export.country_code'), t('export.phone'),
      t('export.email'), t('export.readiness'), t('export.tags'),
    ];
    rows = drivers.map(driver => buildRow([
      driver.internal_number != null ? `DRV-${String(driver.internal_number).padStart(3, '0')}` : '',
      driver.name || '', driver.status || '', driver.nationality_group || '',
      driver.country_code || '', driver.phone || '', driver.email || '',
      driver.trip_readiness_pct != null ? `${driver.trip_readiness_pct}%` : '',
      Array.isArray(driver.tags) ? driver.tags.join(', ') : '',
    ]));

  } else if (templateKey === 'document_statuses') {
    headers = [
      t('export.internal_number'), t('export.full_name'),
      ...DOCUMENT_TYPES.map(dt => t(`doc_types.${dt}`, { defaultValue: dt })),
    ];
    rows = drivers.map(driver => {
      const driverDocs = docsByDriver.get(driver.id) || [];
      return buildRow([
        driver.internal_number != null ? `DRV-${String(driver.internal_number).padStart(3, '0')}` : '',
        driver.name || '',
        ...DOCUMENT_TYPES.map(docType => {
          const doc = getCurrentDoc(driverDocs, docType);
          if (!doc) return 'missing';
          return doc.return_status === 'pending_return' ? `${doc.status} (pending return)` : (doc.status || 'missing');
        }),
      ]);
    });

  } else if (templateKey === 'document_expiry') {
    headers = [
      t('export.internal_number'), t('export.full_name'),
      ...DOCUMENT_TYPES.map(dt => t(`doc_types.${dt}`, { defaultValue: dt })),
    ];
    rows = drivers.map(driver => {
      const driverDocs = docsByDriver.get(driver.id) || [];
      return buildRow([
        driver.internal_number != null ? `DRV-${String(driver.internal_number).padStart(3, '0')}` : '',
        driver.name || '',
        ...DOCUMENT_TYPES.map(docType => {
          const doc = getCurrentDoc(driverDocs, docType);
          return doc && doc.expiry_date ? formatDate(doc.expiry_date) : '';
        }),
      ]);
    });
  }

  return '\uFEFF' + [buildRow(headers), ...rows].join('\n');
}

// ─── PDF ─────────────────────────────────────────────────────────────────────

const PDF_DOC_ABBRS = ['CON', 'LIC', 'A1', 'DEC', 'INS', 'VIS', 'PAS', 'DL', 'MED', 'PSI', 'ADR', 'TCH', 'C95'];
const TEMPLATE_NAMES = { driver_list: 'Driver List', document_statuses: 'Document Statuses', document_expiry: 'Expiry Dates' };

const STATUS_COLORS = {
  valid:    { bg: [220, 252, 231], text: [22, 101, 52] },
  expiring: { bg: [255, 237, 213], text: [154, 52, 18] },
  expired:  { bg: [254, 226, 226], text: [153, 27, 27] },
  missing:  { bg: [243, 244, 246], text: [107, 114, 128] },
};

function drawTable(doc, { headers, rows, startY, colWidths, rowHeight = 7, statusCols = [] }) {
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;
  const marginL = 10;
  const headerH = 8;
  let y = startY;

  const drawHeader = (yPos) => {
    doc.setFillColor(59, 130, 246);
    doc.rect(marginL, yPos, colWidths.reduce((a, b) => a + b, 0), headerH, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    let x = marginL;
    headers.forEach((h, i) => {
      doc.text(String(h), x + 1, yPos + 5.5, { maxWidth: colWidths[i] - 2 });
      x += colWidths[i];
    });
  };

  drawHeader(y);
  y += headerH;

  rows.forEach((row, rowIdx) => {
    if (y + rowHeight > pageH - 10) {
      doc.addPage();
      y = 14;
      drawHeader(y);
      y += headerH;
    }

    const isAlt = rowIdx % 2 === 1;
    let x = marginL;

    row.forEach((cell, colIdx) => {
      const cellStr = String(cell == null ? '' : cell);
      const isStatus = statusCols.includes(colIdx);
      const baseStatus = isStatus ? cellStr.split('*')[0].split(' ')[0] : null;
      const colors = isStatus && STATUS_COLORS[baseStatus] ? STATUS_COLORS[baseStatus] : null;

      if (colors) {
        doc.setFillColor(...colors.bg);
        doc.rect(x, y, colWidths[colIdx], rowHeight, 'F');
        doc.setTextColor(...colors.text);
      } else if (isAlt) {
        doc.setFillColor(248, 250, 252);
        doc.rect(x, y, colWidths[colIdx], rowHeight, 'F');
        doc.setTextColor(30, 30, 30);
      } else {
        doc.setTextColor(30, 30, 30);
      }

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(cellStr, x + 1, y + 4.8, { maxWidth: colWidths[colIdx] - 2 });
      x += colWidths[colIdx];
    });

    y += rowHeight;
  });

  return y;
}

function addPageNumbers(doc) {
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text('G-Track TMS', 10, doc.internal.pageSize.height - 4);
    doc.text(`Page ${i} of ${totalPages}`, doc.internal.pageSize.width - 10, doc.internal.pageSize.height - 4, { align: 'right' });
  }
}

export function generatePDF(drivers, allDocuments, templateKey) {
  const docsByDriver = getDocsByDriver(allDocuments);
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const today = new Date().toISOString().slice(0, 10);
  const todayStr = formatDate(today);

  // Title
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 30, 30);
  pdf.text(`G-Track — ${TEMPLATE_NAMES[templateKey] || templateKey}`, 10, 10);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(120, 120, 120);
  pdf.text(`Exported: ${todayStr}  •  ${drivers.length} drivers`, 10, 16);
  pdf.setTextColor(0, 0, 0);

  if (templateKey === 'driver_list') {
    const headers = ['#', 'Full Name', 'Status', 'Nat.', 'CC', 'Phone', 'Email', 'Ready', 'Tags'];
    const colWidths = [22, 40, 18, 12, 12, 28, 46, 14, 95];
    const rows = drivers.map(driver => [
      driver.internal_number != null ? `DRV-${String(driver.internal_number).padStart(3, '0')}` : '',
      driver.name || '', driver.status || '', driver.nationality_group || '',
      driver.country_code || '', driver.phone || '', driver.email || '',
      driver.trip_readiness_pct != null ? `${driver.trip_readiness_pct}%` : '',
      Array.isArray(driver.tags) ? driver.tags.join(', ') : '',
    ]);
    drawTable(pdf, { headers, rows, startY: 22, colWidths });

  } else if (templateKey === 'document_statuses') {
    const headers = ['#', 'Full Name', ...PDF_DOC_ABBRS];
    const colWidths = [22, 40, ...Array(PDF_DOC_ABBRS.length).fill(16.3)];
    const rows = drivers.map(driver => {
      const driverDocs = docsByDriver.get(driver.id) || [];
      return [
        driver.internal_number != null ? `DRV-${String(driver.internal_number).padStart(3, '0')}` : '',
        driver.name || '',
        ...DOCUMENT_TYPES.map(docType => {
          const d = getCurrentDoc(driverDocs, docType);
          if (!d) return 'missing';
          return d.return_status === 'pending_return' ? `${d.status}*` : (d.status || 'missing');
        }),
      ];
    });
    const statusCols = DOCUMENT_TYPES.map((_, i) => i + 2);
    drawTable(pdf, { headers, rows, startY: 22, colWidths, statusCols });

  } else if (templateKey === 'document_expiry') {
    const headers = ['#', 'Full Name', ...PDF_DOC_ABBRS];
    const colWidths = [22, 40, ...Array(PDF_DOC_ABBRS.length).fill(16.3)];
    const rows = drivers.map(driver => {
      const driverDocs = docsByDriver.get(driver.id) || [];
      return [
        driver.internal_number != null ? `DRV-${String(driver.internal_number).padStart(3, '0')}` : '',
        driver.name || '',
        ...DOCUMENT_TYPES.map(docType => {
          const d = getCurrentDoc(driverDocs, docType);
          return d && d.expiry_date ? formatDate(d.expiry_date) : '';
        }),
      ];
    });
    drawTable(pdf, { headers, rows, startY: 22, colWidths });
  }

  addPageNumbers(pdf);
  return pdf;
}

export function downloadPDF(doc, templateKey) {
  const today = new Date().toISOString().slice(0, 10);
  doc.save(`g-track_${templateKey}_${today}.pdf`);
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