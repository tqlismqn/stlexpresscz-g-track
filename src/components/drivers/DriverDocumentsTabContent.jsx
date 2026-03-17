import React from 'react';
import { DOCUMENT_TYPES, SECTIONS, formatDate, getRemainingDays } from '@/lib/documentTypes';

const STATUS_DOT = {
  valid: 'bg-green-500',
  expiring: 'bg-yellow-500',
  expired: 'bg-red-500',
  missing: 'bg-gray-300',
  pending_renewal: 'bg-blue-500',
};

function RemainingDays({ expiryDate, status }) {
  if (!expiryDate) return null;
  const days = getRemainingDays(expiryDate);
  if (days === null) return null;
  if (days < 0) return <span className="text-red-600 font-medium">Просрочено на {Math.abs(days)} дн.</span>;
  if (days <= 30) return <span className="text-yellow-600 font-medium">Осталось {days} дн.</span>;
  return <span className="text-gray-500">Осталось {days} дн.</span>;
}

function DocumentRow({ docType, config, doc }) {
  const status = doc?.status || 'missing';
  const dotColor = STATUS_DOT[status] || 'bg-gray-300';

  const fromStr = doc?.issue_date ? formatDate(doc.issue_date) : '—';
  const toStr = (!doc?.expiry_date && config.indefiniteByDefault)
    ? 'na dobu neurčitou'
    : (doc?.expiry_date ? formatDate(doc.expiry_date) : '—');

  const hasDateLine = doc?.document_number || doc?.issue_date || doc?.expiry_date || config.indefiniteByDefault;

  return (
    <div className="flex items-start gap-3 py-2">
      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${dotColor}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-medium text-gray-900">{config.name}</span>
          <span className="text-xs text-gray-400">({config.abbr})</span>
        </div>
        {doc ? (
          <div className="text-xs text-gray-500 mt-0.5">
            {doc.document_number ? `№${doc.document_number} · ` : ''}
            {fromStr} → {toStr}
          </div>
        ) : (
          <div className="text-xs text-gray-400 mt-0.5">Нет данных</div>
        )}
      </div>
      <div className="text-xs text-right flex-shrink-0 min-w-[80px]">
        {doc && <RemainingDays expiryDate={doc.expiry_date} status={status} />}
      </div>
    </div>
  );
}

export default function DriverDocumentsTabContent({ driver, documents = [] }) {
  const isNonEU = driver?.nationality_group === 'non-EU';
  const docsMap = new Map(documents.map(d => [d.document_type, d]));

  const sectionEntries = Object.entries(DOCUMENT_TYPES).reduce((acc, [type, config]) => {
    if (config.nonEUOnly && !isNonEU) return acc;
    if (!acc[config.section]) acc[config.section] = [];
    acc[config.section].push({ type, config });
    return acc;
  }, {});

  return (
    <div className="divide-y divide-gray-100">
      {[1, 2, 3].map(sectionNum => {
        const items = sectionEntries[sectionNum];
        if (!items || items.length === 0) return null;
        return (
          <div key={sectionNum} className="p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">
              {SECTIONS[sectionNum]}
            </p>
            <div className="divide-y divide-gray-50">
              {items.map(({ type, config }) => (
                <DocumentRow
                  key={type}
                  docType={type}
                  config={config}
                  doc={docsMap.get(type) || null}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}