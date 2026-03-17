import React, { useMemo } from 'react';

const avatarColors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-amber-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-rose-500'
];

const documentConfig = {
  work_contract: { abbr: 'CON', isRequired: true },
  transport_licence: { abbr: 'LIC', isRequired: true },
  a1_certificate: { abbr: 'A1', isRequired: true },
  declaration: { abbr: 'DEC', isRequired: true },
  insurance: { abbr: 'INS', isRequired: true },
  travel_insurance: { abbr: 'TIN', isRequired: true },
  visa: { abbr: 'VISA', isRequired: true },
  passport: { abbr: 'PAS', isRequired: true },
  driver_license: { abbr: 'DL', isRequired: true },
  medical_certificate: { abbr: 'MED', isRequired: true },
  psihotest: { abbr: 'PSI', isRequired: true },
  adr_certificate: { abbr: 'ADR', isRequired: false },
  chip_card: { abbr: 'CHIP', isRequired: false },
  code95: { abbr: 'C95', isRequired: false }
};

const euRequiredDocs = ['work_contract', 'a1_certificate', 'declaration', 'insurance', 'passport', 'driver_license', 'medical_certificate', 'psihotest'];
const nonEuRequiredDocs = ['work_contract', 'transport_licence', 'a1_certificate', 'declaration', 'insurance', 'travel_insurance', 'visa', 'passport', 'driver_license', 'medical_certificate', 'psihotest'];

const formatDriverName = (fullName) => {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length > 1) {
    const lastName = parts[0];
    const firstName = parts.slice(1).join(' ');
    return `${firstName} ${lastName}`;
  }
  return fullName;
};

function getInitials(name) {
  if (!name) return '??';
  const formatted = formatDriverName(name);
  const parts = formatted.split(' ');
  let initials = parts[0]?.[0] || '';
  if (parts.length > 1) initials += parts[parts.length - 1]?.[0] || '';
  return initials.toUpperCase();
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function getAvatarColor(name) {
  const hash = hashString(name);
  return avatarColors[hash % avatarColors.length];
}

function getReadinessBarColor(pct) {
  if (pct >= 80) return 'bg-green-500';
  if (pct >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

function getReadinessTextColor(pct) {
  if (pct >= 80) return 'text-green-600';
  if (pct >= 50) return 'text-amber-600';
  return 'text-red-600';
}

function getStatusPillClass(status) {
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
      return 'bg-gray-50 text-gray-400 border border-dashed border-gray-300';
    default:
      return 'bg-gray-50 text-gray-400 border border-dashed border-gray-300';
  }
}

export default function DriverListItem({ driver, documents, isSelected, onSelect }) {
  const readiness = driver.trip_readiness_pct || 0;
  
  const documentPills = useMemo(() => {
    const isEU = driver.nationality_group === 'EU';
    const requiredDocTypes = isEU ? euRequiredDocs : nonEuRequiredDocs;
    
    // Create a map of document types to their statuses
    const docMap = new Map();
    documents.forEach(doc => {
      docMap.set(doc.document_type, doc.status);
    });

    // Build required pills
    const pills = requiredDocTypes.map(docType => {
      const config = documentConfig[docType];
      const status = docMap.get(docType) || 'missing';
      return {
        type: docType,
        abbr: config.abbr,
        status,
        isRequired: true
      };
    });

    // Add optional pills only if they exist
    const optionalDocs = ['adr_certificate', 'chip_card', 'code95'];
    optionalDocs.forEach(docType => {
      if (docMap.has(docType)) {
        const config = documentConfig[docType];
        pills.push({
          type: docType,
          abbr: config.abbr,
          status: docMap.get(docType),
          isRequired: false
        });
      }
    });

    return pills;
  }, [driver.nationality_group, documents]);

  const drvId = driver.id.length > 4 ? driver.id.slice(-4) : driver.id;

  return (
    <button
      onClick={() => onSelect(driver)}
      className={`w-full text-left p-4 transition-colors ${
        isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-gray-50'
      } ${driver.status === 'inactive' ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full ${getAvatarColor(driver.name)} flex items-center justify-center flex-shrink-0`}>
          <span className="text-white font-bold text-sm">{getInitials(driver.name)}</span>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Line 1: Name, DRV-ID, Nationality badge */}
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-gray-900">{formatDriverName(driver.name)}</p>
            <span className="text-xs text-muted-foreground">DRV-{drvId}</span>
            <span className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
              driver.nationality_group === 'EU'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {driver.nationality_group === 'EU' ? 'EU' : 'non-EU'}
            </span>
          </div>

          {/* Line 2: Document pills */}
          <div className="flex flex-wrap gap-0.5 mb-2">
            {documentPills.map(pill => (
              <div
                key={pill.type}
                className={`h-5 px-1.5 rounded-sm border flex items-center justify-center text-[10px] font-medium ${getStatusPillClass(
                  pill.status
                )}`}
              >
                {pill.abbr}
              </div>
            ))}
          </div>

          {/* Line 3: Readiness bar + percentage */}
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${getReadinessBarColor(readiness)}`}
                style={{ width: `${readiness}%` }}
              />
            </div>
            <span className={`text-xs font-medium ${getReadinessTextColor(readiness)}`}>
              {readiness}%
            </span>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex-shrink-0">
          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
            driver.status === 'active'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'
          }`}>
            {driver.status === 'active' ? 'Активный' : 'Неактивный'}
          </span>
        </div>
      </div>
    </button>
  );
}