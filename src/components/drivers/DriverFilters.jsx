import React from 'react';
import { Search } from 'lucide-react';

const visaTypes = {
  povoleni_k_pobytu: 'Povolení k pobytu',
  vizum: 'Vizum',
  docasna_ochrana: 'Dočasná ochrana',
  trvaly_pobyt: 'Trvalý pobyt',
  vizum_strpeni: 'Vizum strpení'
};

export default function DriverFilters({ filters, setFilters }) {
  return (
    <div className="space-y-4 mb-6">
      <div className="flex gap-2 flex-wrap">
        {['all', 'active', 'inactive', 'not-ready', 'expiring'].map(status => (
          <button
            key={status}
            onClick={() => setFilters({ ...filters, status })}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filters.status === status
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {status === 'all' && 'Все'}
            {status === 'active' && 'Активные'}
            {status === 'inactive' && 'Неактивные'}
            {status === 'not-ready' && 'Не готовы'}
            {status === 'expiring' && 'Истекающие'}
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по имени..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>

        <select
          value={filters.visaType}
          onChange={(e) => setFilters({ ...filters, visaType: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
        >
          <option value="all">Все типы виз</option>
          {Object.entries(visaTypes).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        <select
          value={filters.sortBy}
          onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
        >
          <option value="name">Сортировка по имени</option>
          <option value="readiness">Сортировка по готовности</option>
        </select>
      </div>
    </div>
  );
}