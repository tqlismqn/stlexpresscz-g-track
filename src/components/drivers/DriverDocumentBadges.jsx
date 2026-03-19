import { useMemo } from 'react';

export const documentConfig = {
  work_contract:       { abbr: 'CON', isRequired: true },
  transport_licence:   { abbr: 'LIC', isRequired: true },
  a1_certificate:      { abbr: 'A1',  isRequired: true },
  declaration:         { abbr: 'DEC', isRequired: true },
  insurance:           { abbr: 'INS', isRequired: true },
  travel_insurance:    { abbr: 'TIS', isRequired: true },
  visa:                { abbr: 'VIS', isRequired: true },
  passport:            { abbr: 'PAS', isRequired: true },
  driver_license:      { abbr: 'DL',  isRequired: true },
  medical_certificate: { abbr: 'MED', isRequired: true },
  psihotest:           { abbr: 'PSI', isRequired: true },
  adr_certificate:     { abbr: 'ADR', isRequired: false },
  chip_card:           { abbr: 'TCH', isRequired: false },
  code95:              { abbr: 'C95', isRequired: false },
};

export const euRequiredDocs    = ['work_contract', 'transport_licence', 'a1_certificate', 'declaration', 'insurance', 'passport', 'driver_license', 'medical_certificate', 'psihotest'];
export const nonEuRequiredDocs = ['work_contract', 'transport_licence', 'a1_certificate', 'declaration', 'insurance', 'travel_insurance', 'visa', 'passport', 'driver_license', 'medical_certificate', 'psihotest'];
export const optionalDocs      = ['adr_certificate', 'chip_card', 'code95'];

export function getPillClass(status, isRequired) {
  switch (status) {
    case 'valid':
      return 'bg-green-100 text-green-700 border border-green-300';
    case 'expiring':
      return 'bg-amber-100 text-amber-700 border border-amber-300';
    case 'expired':
      return 'bg-red-100 text-red-700 border border-red-300';
    case 'pending_renewal':
      return 'bg-blue-100 text-blue-700 border border-blue-300';
    case 'missing':
      return isRequired
        ? 'bg-red-50 text-red-400 border border-dashed border-red-300'
        : 'bg-gray-50 text-gray-300 border border-dashed border-gray-200';
    default:
      return 'bg-gray-50 text-gray-300 border border-dashed border-gray-200';
  }
}

export default function DriverDocumentBadges({ driver, documents, size = 'sm' }) {
  const pillHeight = size === 'md' ? 'h-6 px-2 text-xs' : 'h-5 px-1.5 text-[10px]';

  const LICENCE_TYPES = ['transport_licence', 'licence'];

  // Build a set of types that have at least one pending_return doc
  const pendingReturnTypes = useMemo(() => {
    const set = new Set();
    documents.forEach(d => {
      if (d.return_status === 'pending_return') {
        // Normalize licence types
        set.add(LICENCE_TYPES.includes(d.document_type) ? 'transport_licence' : d.document_type);
      }
    });
    return set;
  }, [documents]);

  const documentPills = useMemo(() => {
    const isEU = driver.nationality_group === 'EU';
    const requiredDocTypes = isEU ? euRequiredDocs : nonEuRequiredDocs;

    // For status: use the newest doc per type (sort by expiry_date desc)
    const docMap = new Map();
    [...documents]
      .sort((a, b) => (b.expiry_date || '') > (a.expiry_date || '') ? 1 : -1)
      .forEach(doc => {
        const key = LICENCE_TYPES.includes(doc.document_type) ? 'transport_licence' : doc.document_type;
        if (!docMap.has(key)) docMap.set(key, doc.status);
      });

    const pills = requiredDocTypes.map(docType => ({
      type: docType,
      abbr: documentConfig[docType].abbr,
      status: docMap.get(docType) || 'missing',
      isRequired: true,
    }));

    optionalDocs.forEach(docType => {
      pills.push({
        type: docType,
        abbr: documentConfig[docType].abbr,
        status: docMap.get(docType) || 'missing',
        isRequired: false,
      });
    });

    return pills;
  }, [driver.nationality_group, documents]);

  const a1SwitzerlandDocIds = useMemo(() => {
    const set = new Set();
    documents.forEach(d => {
      if (d.document_type === 'a1_certificate' && d.a1_switzerland) set.add(d.driver_id);
    });
    return set;
  }, [documents]);

  return (
    <div className="flex flex-wrap gap-0.5">
      {documentPills.map(pill => (
        <div
          key={pill.type}
          className={`relative rounded-sm flex items-center justify-center font-medium ${pillHeight} ${getPillClass(pill.status, pill.isRequired)}`}
        >
          {pill.type === 'a1_certificate' && a1SwitzerlandDocIds.has(driver.id)
            ? <span>{pill.abbr}<span className="text-[8px] leading-none ml-0.5 opacity-80">CH</span></span>
            : pill.abbr}
          {pendingReturnTypes.has(pill.type) && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-500 border border-white" />
          )}
        </div>
      ))}
    </div>
  );
}