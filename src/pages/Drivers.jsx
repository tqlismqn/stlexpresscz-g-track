import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import DriverList from '@/components/drivers/DriverList';
import DriverDetail from '@/components/drivers/DriverDetail';
import DriverFilters from '@/components/drivers/DriverFilters';

export default function Drivers() {
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    visaType: 'all',
    search: '',
    sortBy: 'name'
  });

  const { data: drivers = [], isLoading, refetch } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => base44.entities.Driver.list()
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.DriverDocument.list()
  });

  const filteredDrivers = useMemo(() => {
    let result = drivers;

    if (filters.status !== 'all') {
      if (filters.status === 'not-ready') {
        result = result.filter(d => d.trip_readiness_pct < 100);
      } else if (filters.status === 'expiring') {
        const driverIds = new Set(documents
          .filter(d => d.status === 'expiring')
          .map(d => d.driver_id));
        result = result.filter(d => driverIds.has(d.id));
      } else {
        result = result.filter(d => d.status === filters.status);
      }
    }

    if (filters.visaType !== 'all') {
      result = result.filter(d => d.visa_type === filters.visaType);
    }

    if (filters.search) {
      result = result.filter(d =>
        d.name.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    result.sort((a, b) => {
      if (filters.sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (filters.sortBy === 'readiness') {
        return (b.trip_readiness_pct || 0) - (a.trip_readiness_pct || 0);
      }
      return 0;
    });

    return result;
  }, [drivers, documents, filters]);

  const handleSaveDriver = async () => {
    await refetch();
    setEditMode(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Водители</h1>

        <div className="flex gap-6">
          <div className="flex-1">
            <DriverFilters filters={filters} setFilters={setFilters} />
            <DriverList
              drivers={filteredDrivers}
              documents={documents}
              selectedDriver={selectedDriver}
              onSelectDriver={setSelectedDriver}
              isLoading={isLoading}
            />
          </div>
          <div className="w-96">
            <DriverDetail
              driver={selectedDriver}
              editMode={editMode}
              onEditModeChange={setEditMode}
              onSave={handleSaveDriver}
              documents={documents.filter(d => d.driver_id === selectedDriver?.id)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}