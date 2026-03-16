import React from 'react';

export default function DriverListItem({ driver, isSelected, onSelect }) {
  const readinessColor =
    driver.trip_readiness_pct === 100
      ? 'text-green-600'
      : driver.trip_readiness_pct >= 50
      ? 'text-orange-600'
      : 'text-red-600';

  const statusBg = driver.status === 'active' ? 'bg-green-100' : 'bg-gray-100';
  const statusText = driver.status === 'active' ? 'text-green-700' : 'text-gray-700';

  return (
    <button
      onClick={() => onSelect(driver)}
      className={`w-full text-left p-4 transition-colors ${
        isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{driver.name}</p>
          <p className="text-sm text-gray-600">{driver.email}</p>
        </div>
        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${statusBg} ${statusText}`}>
          {driver.status === 'active' ? 'Активный' : 'Неактивный'}
        </span>
      </div>
      <div className="mt-2 flex justify-between items-center">
        <span className="text-xs text-gray-500">{driver.phone}</span>
        <span className={`text-sm font-semibold ${readinessColor}`}>
          {driver.trip_readiness_pct || 0}%
        </span>
      </div>
    </button>
  );
}