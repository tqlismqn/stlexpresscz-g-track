import React from 'react';
import DriverListItem from './DriverListItem';
import { useTranslation } from 'react-i18next';

export default function DriverList({ drivers, documents, selectedDriver, onSelectDriver, isLoading, selectedDriverIds, onToggleSelect }) {
  const { t } = useTranslation();

  if (isLoading) {
    return <div className="bg-white rounded-lg shadow p-4">{t('common.loading')}</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow divide-y overflow-y-auto h-full">
      {drivers.length === 0 ? (
        <div className="p-6 text-center text-gray-500">{t('drivers.not_found')}</div>
      ) : (
        drivers.map(driver => (
          <DriverListItem
            key={driver.id}
            driver={driver}
            documents={documents.filter(d => d.driver_id === driver.id)}
            isSelected={selectedDriver?.id === driver.id}
            onSelect={onSelectDriver}
            isChecked={selectedDriverIds?.has(driver.id)}
            onToggleSelect={onToggleSelect}
          />
        ))
      )}
    </div>
  );
}