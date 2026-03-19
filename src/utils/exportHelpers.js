import jsPDF from 'jspdf';
import 'jspdf-autotable';

// TODO: Embed custom font (e.g., Roboto) for full Cyrillic/Czech support

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

// English-only headers for PDF (default font lacks Cyrillic/Czech glyphs)
const PDF_DRIVER_LIST_HEADERS = ['#', 'Full Name', 'Status', 'Nationality', 'Country', 'Phone', 'Email', 'Readiness', 'Tags'];
const PDF_DOC_ABBRS = ['CON', 'LIC', 'A1', 'DEC', 'INS', 'VIS', 'PAS', 'DL', 'MED', 'PSI', 'ADR', 'TCH', 'C95'];

const STATUS_COLORS = {
  valid:    { bg: [220, 252, 231], text: [22, 101, 52] },
  expiring: { bg: [255, 237, 213], text: [154, 52, 18] },
  expired:  { bg: [254, 226, 226], text: [153, 27, 27] },
  missing:  { bg: [243, 244, 246], text: [107, 114, 128] },
};

export function generatePDF(drivers, allDocuments, templateKey) {
  // Group documents by driver_id, only current docs
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

  const TEMPLATE_NAMES = {
    driver_list: 'Driver List',
    document_statuses: 'Document Statuses',
    document_expiry: 'Expiry Dates',
  };

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const today = new Date();
  const todayStr = formatDate(today.toISOString().slice(0, 10));

  let head = [];
  let body = [];

  if (templateKey === 'driver_list') {
    head = [PDF_DRIVER_LIST_HEADERS];
    body = drivers.map(driver => [
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
    head = [['#', 'Full Name', ...PDF_DOC_ABBRS]];
    body = drivers.map(driver => {
      const driverDocs = docsByDriver.get(driver.id) || [];
      return [
        driver.internal_number != null ? `DRV-${String(driver.internal_number).padStart(3, '0')}` : '',
        driver.name || '',
        ...DOCUMENT_TYPES.map(docType => {
          const d = getCurrentDoc(driverDocs, docType);
          if (!d) return 'missing';
          let status = d.status || 'missing';
          if (d.return_status === 'pending_return') status += '*';
          return status;
        }),
      ];
    });

  } else if (templateKey === 'document_expiry') {
    head = [['#', 'Full Name', ...PDF_DOC_ABBRS]];
    body = drivers.map(driver => {
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
  }

  // Title + subtitle
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`G-Track — ${TEMPLATE_NAMES[templateKey] || templateKey}`, 14, 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(`Exported: ${todayStr}  •  Showing ${drivers.length} drivers`, 14, 19);
  doc.setTextColor(0, 0, 0);

  const tableOptions = {
    head,
    body,
    startY: 25,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didDrawPage: (data) => {
      const pageCount = doc.internal.getNumberOfPages();
      const pageNum = data.pageNumber;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('G-Track TMS', 14, doc.internal.pageSize.height - 5);
      doc.text(`Page ${pageNum} of ${pageCount}`, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 5, { align: 'right' });
      doc.setTextColor(0, 0, 0);
    },
  };

  if (templateKey === 'document_statuses') {
    tableOptions.didParseCell = (data) => {
      if (data.section === 'body' && data.column.index >= 2) {
        const val = String(data.cell.raw || '');
        const baseStatus = val.split('*')[0].split(' ')[0];
        const colors = STATUS_COLORS[baseStatus];
        if (colors) {
          data.cell.styles.fillColor = colors.bg;
          data.cell.styles.textColor = colors.text;
        }
      }
    };
  }

  doc.autoTable(tableOptions);
  return doc;
}

export function downloadPDF(doc, templateKey) {
  const today = new Date().toISOString().slice(0, 10);
  const filename = `g-track_${templateKey}_${today}.pdf`;
  doc.save(filename);
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