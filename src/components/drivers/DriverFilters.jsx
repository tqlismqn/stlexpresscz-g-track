import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, X, Filter, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { hasPermission } from '@/lib/permissions';

export default function DriverFilters({ permissions = [], filters, setFilters, counts = {}, onCreateDriver, docTypeFilter, docStatusFilter, onDocTypeChange, onDocStatusChange, visaTypeFilter, onVisaTypeChange, a1SwitzerlandFilter, onA1SwitzerlandChange, pendingReturnFilter, onPendingReturnChange, filteredCount, totalCount, isAllSelected, onToggleSelectAll, hasFilteredResults, onExportCSV, onExportPDF }) {
  const { t } = useTranslation();
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);
  const docFiltersActive = docTypeFilter !== 'all' || docStatusFilter !== 'any' || visaTypeFilter !== 'any' || a1SwitzerlandFilter || pendingReturnFilter;

  useEffect(() => {
    if (!exportOpen) return;
    const handler = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [exportOpen]);

  const exportTemplates = [
    { key: 'driver_list', icon: '📋', label: t('export.driver_list'), desc: t('export.driver_list_desc') },
    { key: 'document_statuses', icon: '📊', label: t('export.document_statuses'), desc: t('export.document_statuses_desc') },
    { key: 'document_expiry', icon: '📅', label: t('export.document_expiry'), desc: t('export.document_expiry_desc') },
  ];

  const VISA_TYPES = [
    { value: 'any',                label: t('filters.any_visa_type') },
    { value: 'docasna_ochrana',    label: t('visa_types.docasna_ochrana') },
    { value: 'povoleni_k_pobytu',  label: t('visa_types.povoleni_k_pobytu') },
    { value: 'trvaly_pobyt',       label: t('visa_types.trvaly_pobyt') },
    { value: 'vizum',              label: t('visa_types.vizum') },
    { value: 'vizum_strpeni',      label: t('visa_types.vizum_strpeni') },
    { value: 'other',              label: t('visa_types.other') },
  ];

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
    { key: 'all',        label: t('common.all'),           countKey: 'all' },
    { key: 'candidates', label: t('filters.candidates'),   countKey: 'candidates' },
    { key: 'ready',      label: t('filters.ready'),        countKey: 'ready' },
    { key: 'incomplete', label: t('filters.incomplete'),   countKey: 'incomplete' },
    { key: 'expiring',   label: t('filters.expiring'),     countKey: 'expiring' },
    { key: 'expired',    label: t('filters.expired'),      countKey: 'expired' },
    { key: 'archived',   label: t('filters.archived'),     countKey: 'archived' },
  ];

  return (
    <div className="space-y-4">
      {/* Row 1: Title + Add button */}
       <div className="flex justify-between items-center">
         <h1 className="text-2xl font-bold text-gray-900">{t('drivers.title')}</h1>
         {hasPermission(permissions, 'driver_create') && (
           <button
             onClick={onCreateDriver}
             className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
           >
             <Plus className="w-4 h-4" />
             {t('drivers.add_driver')}
           </button>
         )}
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
            } ${item.key === 'archived' ? 'ml-2' : ''}`}
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

      {/* Row 2: Doc filters + Search (combined) */}
      <div className="bg-slate-50 rounded-lg px-3 py-2 flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
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

        {docTypeFilter === 'visa' && (
          <select
            value={visaTypeFilter}
            onChange={(e) => onVisaTypeChange(e.target.value)}
            className="px-3 py-1.5 text-sm border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-600 bg-blue-50 text-blue-800"
          >
            {VISA_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        )}

        {docTypeFilter === 'a1_certificate' && (
          <label className="flex items-center gap-1.5 cursor-pointer px-2 py-1.5 border border-blue-300 rounded-md bg-blue-50 text-blue-800 text-sm whitespace-nowrap select-none">
            <input
              type="checkbox"
              checked={!!a1SwitzerlandFilter}
              onChange={(e) => onA1SwitzerlandChange(e.target.checked)}
              className="w-3.5 h-3.5 accent-blue-600"
            />
            🇨🇭 {t('filters.a1_switzerland')}
          </label>
        )}

        <label className="flex items-center gap-1.5 cursor-pointer px-2 py-1.5 border border-orange-300 rounded-md bg-orange-50 text-orange-800 text-sm whitespace-nowrap select-none">
          <input
            type="checkbox"
            checked={!!pendingReturnFilter}
            onChange={(e) => onPendingReturnChange(e.target.checked)}
            className="w-3.5 h-3.5 accent-orange-600"
          />
          ⏳ {t('filters.pending_return')}
        </label>

        <div className="w-px h-5 bg-gray-300 mx-1 flex-shrink-0" />

        {hasFilteredResults && (
          <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap select-none flex-shrink-0">
            <input
              type="checkbox"
              checked={!!isAllSelected}
              onChange={onToggleSelectAll}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">{t('export.select_all')}</span>
          </label>
        )}

        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder={t('common.search')}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-8 pr-7 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => setFilters({ ...filters, search: '' })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {hasPermission(permissions, 'driver_export') && (
           <div className="relative flex-shrink-0" ref={exportRef}>
             <button
               onClick={() => setExportOpen(v => !v)}
               className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 whitespace-nowrap transition-colors"
             >
               {t('export.export')} <ChevronDown className="w-3.5 h-3.5" />
             </button>
          {exportOpen && (
            <div className="absolute top-full mt-1 right-0 w-64 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-20">
              {exportTemplates.map(tpl => (
                <div key={tpl.key} className="flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                  <div className="flex-1 min-w-0 mr-2">
                    <div className="text-sm font-medium text-gray-800 truncate">{tpl.icon} {tpl.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{tpl.desc}</div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => { setExportOpen(false); onExportCSV(tpl.key); }}
                      className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition-colors"
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => { setExportOpen(false); onExportPDF(tpl.key); }}
                      className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors"
                    >
                      PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
          )}

          {docFiltersActive && (
          <>
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {t('filters.showing_filtered', { count: filteredCount, total: totalCount })}
            </span>
            <button
              onClick={() => { onDocTypeChange('all'); onDocStatusChange('any'); onVisaTypeChange('any'); onA1SwitzerlandChange(false); onPendingReturnChange(false); }}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-800 border border-gray-300 rounded-md bg-white whitespace-nowrap"
            >
              <X className="w-3 h-3" /> {t('filters.clear_doc_filters')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}