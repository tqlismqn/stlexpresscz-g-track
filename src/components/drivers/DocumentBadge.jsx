import React from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function DocumentBadge({ label, status, expiryDate }) {
  const getStatusStyle = () => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-700 border border-green-300';
      case 'expiring':
        return 'bg-orange-100 text-orange-700 border border-orange-300';
      case 'expired':
        return 'bg-red-100 text-red-700 border border-red-300';
      case 'pending_renewal':
        return 'bg-blue-100 text-blue-700 border border-blue-300';
      case 'missing':
        return 'bg-red-100 text-red-700 border-2 border-dashed border-red-400';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-300';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'valid':
        return 'Действителен';
      case 'expiring':
        return 'Истекает';
      case 'expired':
        return 'Истёк';
      case 'pending_renewal':
        return 'На обновление';
      case 'missing':
        return 'Отсутствует';
      default:
        return 'Неизвестно';
    }
  };

  return (
    <div className={`px-3 py-2 rounded text-sm font-medium flex justify-between items-center ${getStatusStyle()}`}>
      <span>{label}</span>
      <div className="text-right">
        <div className="text-xs">{getStatusLabel()}</div>
        {expiryDate && (
          <div className="text-xs opacity-75">
            {format(new Date(expiryDate), 'd MMM yyyy', { locale: ru })}
          </div>
        )}
      </div>
    </div>
  );
}