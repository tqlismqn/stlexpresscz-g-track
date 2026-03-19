import React from 'react';
import { getIncompleteFields } from '@/lib/dataCompleteness';
import { getCountryByCode } from '@/lib/countries';
import { formatDriverId } from '@/lib/driverUtils';
import { useTranslation } from 'react-i18next';
import { useDriverTags } from '@/hooks/useDriverTags';
import DriverDocumentBadges from './DriverDocumentBadges';

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



export default function DriverListItem({ driver, documents, isSelected, onSelect, isChecked, onToggleSelect }) {
  const { t } = useTranslation();
  const { tagMap } = useDriverTags();

  const statusConfig = {
    candidate: { bg: 'bg-purple-100 text-purple-700', label: t('drivers.status_candidate') },
    active:    { bg: 'bg-green-100 text-green-700',   label: t('drivers.status_active') },
    archived:  { bg: 'bg-gray-100 text-gray-500',     label: t('drivers.status_archived') },
  };

  const daysAsCandidate = driver.status === 'candidate' && driver.created_date
    ? Math.floor((Date.now() - new Date(driver.created_date).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const readiness = driver.trip_readiness_pct || 0;
  const incompleteFields = getIncompleteFields(driver);
  const hasIncomplete = incompleteFields.length > 0;

  const drvId = formatDriverId(driver);

  return (
    <button
      onClick={() => onSelect(driver)}
      className={`w-full text-left p-4 transition-colors ${
        isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-gray-50'
      } ${driver.status === 'archived' ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full ${getAvatarColor(driver.name)} flex items-center justify-center flex-shrink-0`}>
          <span className="text-white font-bold text-sm">{getInitials(driver.name)}</span>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Line 1: Name, incomplete warning, DRV-ID, Nationality badge */}
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-gray-900">{formatDriverName(driver.name)}</p>
            {hasIncomplete && (
              <span title={t('drivers.incomplete_data')} className="text-amber-400 text-xs leading-none">⚠</span>
            )}
            <span className="text-xs text-muted-foreground">{drvId}</span>
            {getCountryByCode(driver.country_code)?.flag ? (
              <span className="text-sm leading-none" title={getCountryByCode(driver.country_code)?.name}>
                {getCountryByCode(driver.country_code).flag}
              </span>
            ) : (
              <span className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                driver.nationality_group === 'EU'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {driver.nationality_group === 'EU' ? 'EU' : 'non-EU'}
              </span>
            )}
          </div>

          {/* Line 2: Document pills */}
          <div className="mb-2">
            <DriverDocumentBadges driver={driver} documents={documents} size="sm" />
          </div>

          {/* Line 3: Readiness bar / candidate days */}
          {daysAsCandidate !== null ? (
            <span className="text-xs text-purple-600 font-medium">
              {t('drivers.days_as_candidate', { count: daysAsCandidate })}
            </span>
          ) : (
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
          )}
        </div>

        {/* Status badge + tags */}
        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          {(() => { const sc = statusConfig[driver.status] || statusConfig.active; return (
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${sc.bg}`}>
              {sc.label}
            </span>
          ); })()}
          {/* Tag pills (max 2 + overflow) */}
          {(() => {
            const driverTagIds = driver.tags || [];
            const resolvedTags = driverTagIds.map(id => tagMap[id]).filter(Boolean);
            const visible = resolvedTags.slice(0, 2);
            const overflow = resolvedTags.length - 2;
            return (
              <div className="flex flex-wrap gap-0.5 justify-end">
                {visible.map(tag => (
                  <span key={tag.id} className={`text-xs px-2 py-0.5 rounded-full font-medium ${tag.color}`}>
                    {t(tag.label_key)}
                  </span>
                ))}
                {overflow > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                    +{overflow}
                  </span>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </button>
  );
}