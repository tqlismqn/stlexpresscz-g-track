import React from 'react';
import { Search, Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function DriverFilters({ filters, setFilters, counts = {}, onCreateDriver }) {
  const { t } = useTranslation();

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

      {/* Row 2: Status pills */}
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
      </div>

      {/* Row 3: Search + filters */}
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

        <select
          value={filters.nationalityFilter}
          onChange={(e) => setFilters({ ...filters, nationalityFilter: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
        >
          <option value="all">{t('drivers.all_drivers')}</option>
          <option value="EU">EU</option>
          <option value="non-EU">non-EU</option>
        </select>

        <select
          value={filters.sortBy}
          onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
        >
          <option value="name">{t('drivers.sort_by_name')}</option>
          <option value="readiness">{t('drivers.sort_by_readiness')}</option>
        </select>
      </div>
    </div>
  );
}