import React from 'react';
import { Search, Plus, X, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function DriverFilters({ filters, setFilters, counts = {}, onCreateDriver, docTypeFilter, docStatusFilter, onDocTypeChange, onDocStatusChange, filteredCount, totalCount }) {
  const { t } = useTranslation();
  const docFiltersActive = docTypeFilter !== 'all' || docStatusFilter !== 'any';

  const DOC_TYPES = [
    { value: 'all',                label: t('filters.all_types') },
    { value: 'work_contract',      label: t('doc_types.work_contract') },
    { value: 'driver_license',     label: t('doc_types.driver_license') },
    { value: 'a1_certificate',     label: t('doc_types.a1_certificate') },
    { value: 'declaration',        label: t('doc_types.declaration') },
    { value: 'insurance',          label: t('doc_types.insurance') },
    { value: 'travel_insurance',   label: t('doc_types.travel_insurance') },
    { value: 'visa',               label: t('doc_types.visa') },
    { value: 'passport',           label: t('doc_types.passport') },
    { value: 'adr_certificate',    label: t('doc_types.adr_certificate') },
    { value: 'medical_certificate',label: t('doc_types.medical_certificate') },
    { value: 'psihotest',          label: t('doc_types.psihotest') },
    { value: 'transport_licence',  label: t('doc_types.transport_licence') },
    { value: 'code95',             label: t('doc_types.code95') },
    { value: 'chip_card',          label: t('doc_types.chip_card') },
  ];

  const DOC_STATUSES = [
    { value: 'any',         label: t('filters.any_status') },
    { value: 'expired',     label: t('filters.expired') },
    { value: 'expiring_30', label: t('filters.expiring_30') },
    { value: 'expiring_60', label: t('filters.expiring_60') },
    { value: 'expiring_90', label: t('filters.expiring_90') },
    { value: 'valid',       label: t('filters.valid') },
    { value: 'missing',     label: t('filters.missing') },
  ];

  const STATUS_PILLS = [
    { key: 'all',        label: t('common.all'),        countKey: 'all' },
    { key: 'ready',      label: t('filters.ready'),      countKey: 'ready' },
    { key: 'incomplete', label: t('filters.incomplete'),  countKey: 'incomplete' },
    { key: 'expiring',   label: t('filters.expiring'),   countKey: 'expiring' },
    { key: 'expired',    label: t('filters.expired'),    countKey: 'expired' },
    { key: 'inactive',   label: t('common.inactive'),    countKey: 'inactive' },
    { key: 'archive',    label: t('filters.archive'),    countKey: 'archive' },
  ];

  return (
    <div className="space-y-4">
      {/* Row 1: Title + Add button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{t('drivers.title')}</h1>
        <button
          onClick={onCreateDriver}
          className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          {t('drivers.add_driver')}
        </button>
      </div>

      {/* Row 2: Status pills + nationality pills */}
      <div className="flex gap-2 flex-wrap items-center">
        {STATUS_PILLS.map(item => (
          <button
            key={item.key}
            onClick={() => setFilters({ ...filters, statusFilter: item.key })}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filters.statusFilter === item.key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            } ${item.key === 'archive' ? 'ml-2' : ''}`}
          >
            {item.label} ({counts[item.countKey] || 0})
          </button>
        ))}

        {/* Separator */}
        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Nationality pills */}
        {[{ val: 'EU', label: t('filters.eu'), countKey: 'eu' }, { val: 'non-EU', label: t('filters.non_eu'), countKey: 'nonEu' }].map(nat => {
          const isActive = filters.nationalityFilter === nat.val;
          return (
            <button
              key={nat.val}
              onClick={() => setFilters({ ...filters, nationalityFilter: isActive ? 'all' : nat.val })}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                isActive
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'bg-white border-blue-300 text-blue-500 hover:bg-blue-50'
              }`}
            >
              {nat.label} ({counts[nat.countKey] || 0})
            </button>
          );
        })}
      </div>

      {/* Row 3: Document filters */}
      <div className="bg-slate-50 rounded-lg p-2 flex flex-wrap items-center gap-2">
        <select
          value={docTypeFilter}
          onChange={(e) => onDocTypeChange(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 bg-white"
        >
          {DOC_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          value={docStatusFilter}
          onChange={(e) => onDocStatusChange(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 bg-white"
        >
          {DOC_STATUSES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {docFiltersActive && (
          <>
            <button
              onClick={() => { onDocTypeChange('all'); onDocStatusChange('any'); }}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-800 border border-gray-300 rounded-md bg-white"
            >
              <X className="w-3 h-3" /> {t('filters.clear_doc_filters')}
            </button>
            <span className="text-xs text-gray-500 ml-1">
              {t('filters.showing_filtered', { count: filteredCount, total: totalCount })}
            </span>
          </>
        )}
      </div>

      {/* Row 4: Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('drivers.search_placeholder')}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-9 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => setFilters({ ...filters, search: '' })}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}