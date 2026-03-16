import React from 'react';
import DriverListItem from './DriverListItem';

export default function DriverList({ drivers, selectedDriver, onSelectDriver, isLoading }) {
  if (isLoading) {
    return <div className="bg-white rounded-lg shadow p-4">Загрузка...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow divide-y max-h-[calc(100vh-200px)] overflow-y-auto">
      {drivers.length === 0 ? (
        <div className="p-6 text-center text-gray-500">Водители не найдены</div>
      ) : (
        drivers.map(driver => (
          <DriverListItem
            key={driver.id}
            driver={driver}
            isSelected={selectedDriver?.id === driver.id}
            onSelect={onSelectDriver}
          />
        ))
      )}
    </div>
  );
}