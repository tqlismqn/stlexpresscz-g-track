import React from 'react';
import { DOCUMENT_TYPES, SECTIONS, formatDate, getRemainingDays } from '@/lib/documentTypes';

const STATUS_COLORS = {
  valid: 'bg-green-500',
  expiring: 'bg-yellow-500',
  expired: 'bg-red-500',
  pending_renewal: 'bg-blue-500',
  missing: 'bg-gray-300',
};

function RemainingDays({ expiryDate, status }) {
  if (!expiryDate) return null;
  const days = getRemainingDays(expiryDate);
  if (days === null) return null;

  if (days < 0) {
    return <span className="text-red-600 font-medium">Просрочено на {Math.abs(days)} дн.</span>;
  }
  if (days <= 30) {
    return <span className="text-yellow-600 font-medium">Осталось {days} дн.</span>;
  }
  return <span className="text-gray-500">Осталось {days} дн.</span>;
}

function DocumentRow({ docType, config, doc }) {
  const status = doc?.status || 'missing';
  const dotColor = STATUS_COLORS[status] || 'bg-gray-300';

  const isIndefinite = config.indefiniteByDefault && !doc?.expiry_date;
  const toDisplay = isIndefinite ? 'na dobu neurčitou' : formatDate(doc?.expiry_date);

  const hasDateInfo = doc?.issue_date || doc?.expiry_date || isIndefinite;

  return (
    <div className="flex items-start gap-3 py-2">
      {/* Status dot */}
      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${dotColor}`} />

      <div className="flex-1 min-w-0">
        {/* Line 1: Name + abbreviation */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-medium text-gray-900">{config.name}</span>
          <span className="text-xs text-gray-400">({config.abbr})</span>
        </div>

        {/* Line 2: Number + dates */}
        <div className="text-xs text-gray-500 mt-0.5">
          {!doc ? (
            <span className="italic text-gray-400">Нет данных</span>
          ) : (
            <>
              {doc.document_number && <span>№{doc.document_number} · </span>}
              {hasDateInfo && (
                <span>{formatDate(doc?.issue_date)} → {toDisplay}</span>
              )}
              {!hasDateInfo && <span className="italic text-gray-400">Нет данных</span>}
            </>
          )}
        </div>
      </div>

      {/* Right side: remaining days */}
      <div className="text-xs text-right flex-shrink-0">
        {doc?.expiry_date && !isIndefinite && (
          <RemainingDays expiryDate={doc.expiry_date} status={status} />
        )}
      </div>
    </div>
  );
}

export default function DriverDocumentsTabContent({ driver, documents = [] }) {
  const isNonEU = driver?.nationality_group === 'non-EU';

  // Build a map: document_type -> document record
  const docsMap = new Map(documents.map(d => [d.document_type, d]));

  // Group doc types by section, filtering nonEUOnly if driver is EU
  const sections = [1, 2, 3].map(sectionNum => {
    const types = Object.entries(DOCUMENT_TYPES).filter(([, config]) => {
      if (config.section !== sectionNum) return false;
      if (config.nonEUOnly && !isNonEU) return false;
      return true;
    });
    return { sectionNum, types };
  });

  return (
    <div className="p-4 space-y-4">
      {sections.map(({ sectionNum, types }) => (
        types.length > 0 && (
          <div key={sectionNum}>
            <p className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">
              {SECTIONS[sectionNum]}
            </p>
            <div className="divide-y divide-gray-50">
              {types.map(([docType, config]) => (
                <DocumentRow
                  key={docType}
                  docType={docType}
                  config={config}
                  doc={docsMap.get(docType) || null}
                />
              ))}
            </div>
          </div>
        )
      ))}
    </div>
  );
}