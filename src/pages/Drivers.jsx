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
    <div className="h-[calc(100vh-56px)] flex flex-col">
      {/* Header + filters */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="w-full px-6 py-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Водители</h1>
          <DriverFilters filters={filters} setFilters={setFilters} />
        </div>
      </div>

      {/* Main content: two independent scroll areas */}
      <div className="flex flex-1 min-h-0 gap-6 overflow-hidden px-6 pb-4">
        {/* Left: Driver list */}
        <div className="w-[60%] min-w-0 flex flex-col">
          <DriverList
            drivers={filteredDrivers}
            documents={documents}
            selectedDriver={selectedDriver}
            onSelectDriver={setSelectedDriver}
            isLoading={isLoading}
          />
        </div>

        {/* Right: Driver detail panel */}
        <div className="w-[40%] min-w-0 flex flex-col min-h-0">
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
  );
}