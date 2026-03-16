import React from 'react';

export default function DriverDetailView({ driver }) {
  const getReadinessColor = (pct) => {
    if (pct === 100) return 'bg-green-100 text-green-700';
    if (pct >= 50) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  const readinessPct = driver?.trip_readiness_pct || 0;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-gray-500 uppercase">Готовность к рейсу</p>
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                readinessPct === 100
                  ? 'bg-green-600'
                  : readinessPct >= 50
                  ? 'bg-orange-500'
                  : 'bg-red-600'
              }`}
              style={{ width: `${readinessPct}%` }}
            />
          </div>
          <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${getReadinessColor(readinessPct)}`}>
            {readinessPct}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
        <div>
          <p className="text-xs text-gray-500">Email</p>
          <p className="font-medium text-gray-900">{driver?.email || '-'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Телефон</p>
          <p className="font-medium text-gray-900">{driver?.phone || '-'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Статус</p>
          <p className={`font-medium ${driver?.status === 'active' ? 'text-green-700' : 'text-gray-700'}`}>
            {driver?.status === 'active' ? 'Активный' : 'Неактивный'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Дата рождения</p>
          <p className="font-medium text-gray-900">{driver?.date_of_birth || '-'}</p>
        </div>
      </div>
    </div>
  );
}