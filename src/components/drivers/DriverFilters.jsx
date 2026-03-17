import React from 'react';
import { Search, Plus, X } from 'lucide-react';

const STATUS_PILLS = [
  { key: 'all',      label: 'Все',         countKey: 'all' },
  { key: 'ready',      label: 'Готовы',    countKey: 'ready' },
  { key: 'incomplete', label: 'Неполные', countKey: 'incomplete' },
  { key: 'expiring',   label: 'Истекают', countKey: 'expiring' },
  { key: 'expired',  label: 'Просрочены',  countKey: 'expired' },
  { key: 'inactive', label: 'Неактивные',  countKey: 'inactive' },
  { key: 'archive',  label: 'Архив',       countKey: 'archive' },
];

export default function DriverFilters({ filters, setFilters, counts = {}, onCreateDriver }) {
  return (
    <div className="space-y-4">
      {/* Row 1: Title + Add button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Водители</h1>
        <button
          onClick={onCreateDriver}
          className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Добавить водителя
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
            placeholder="Поиск по имени, ID, телефону..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-9 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
          {filters.search && (
            <button
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
          <option value="all">Все водители</option>
          <option value="EU">EU</option>
          <option value="non-EU">non-EU</option>
        </select>

        <select
          value={filters.sortBy}
          onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
        >
          <option value="name">По имени</option>
          <option value="readiness">По готовности</option>
        </select>
      </div>
    </div>
  );
}