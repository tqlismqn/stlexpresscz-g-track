import React, { useState, useMemo } from 'react';
import { Toaster } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import DriverList from '@/components/drivers/DriverList';
import DriverDetail from '@/components/drivers/DriverDetail';
import DriverFilters from '@/components/drivers/DriverFilters';
import { formatDriverId } from '@/lib/driverUtils';

export default function Drivers() {
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [filters, setFilters] = useState({
    statusFilter: 'all',
    nationalityFilter: 'all',
    search: '',
    sortBy: 'name'
  });

  const { data: drivers = [], isLoading, refetch } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => base44.entities.Driver.list()
  });

  const { data: documents = [], refetch: refetchDocuments } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.DriverDocument.list()
  });

  const counts = useMemo(() => {
    if (!drivers.length) return { all: 0, ready: 0, incomplete: 0, expiring: 0, expired: 0, inactive: 0, archive: 0 };

    let src = drivers;
    if (filters.nationalityFilter !== 'all') {
      src = src.filter(d => d.nationality_group === filters.nationalityFilter);
    }

    const active     = src.filter(d => d.status === 'active');
    const inactive   = src.filter(d => d.status === 'inactive' || d.status === 'on_leave');
    const nonArchive = src.filter(d => d.status !== 'terminated');

    const hasDocs = (driver, statuses) => {
      const docs = documents.filter(doc => doc.driver_id === driver.id);
      return docs.some(doc => statuses.includes(doc.status));
    };

    return {
      all:      nonArchive.length,
      ready:    active.filter(d => d.trip_readiness_pct === 100).length,
      incomplete: active.filter(d => {
        if (d.trip_readiness_pct === 100) return false;
        const docs = documents?.filter(doc => doc.driver_id === d.id) || [];
        const hasExpired = docs.some(doc => doc.status === 'expired');
        const hasExpiring = docs.some(doc => doc.status === 'expiring');
        return !hasExpired && !hasExpiring;
      }).length,
      expiring: [...active, ...inactive].filter(d => hasDocs(d, ['expiring'])).length,
      expired:  [...active, ...inactive].filter(d => hasDocs(d, ['expired'])).length,
      inactive: inactive.length,
      archive:  src.filter(d => d.status === 'terminated').length
    };
  }, [drivers, documents, filters.nationalityFilter]);

  const selectedDocuments = useMemo(
    () => documents.filter(d => d.driver_id === selectedDriver?.id),
    [documents, selectedDriver?.id]
  );

  const filteredDrivers = useMemo(() => {
    if (!drivers.length) return [];
    let result = [...drivers];

    // Step 1: Status filter
    switch (filters.statusFilter) {
      case 'all':
        result = result.filter(d => d.status !== 'terminated');
        break;
      case 'ready':
        result = result.filter(d => d.status === 'active' && d.trip_readiness_pct === 100);
        break;
      case 'incomplete':
        result = result.filter(d => {
          if (d.status !== 'active') return false;
          if (d.trip_readiness_pct === 100) return false;
          const docs = documents?.filter(doc => doc.driver_id === d.id) || [];
          const hasExpired = docs.some(doc => doc.status === 'expired');
          const hasExpiring = docs.some(doc => doc.status === 'expiring');
          return !hasExpired && !hasExpiring;
        });
        break;
      case 'expiring':
        result = result.filter(d => {
          if (d.status !== 'active' && d.status !== 'inactive') return false;
          const docs = documents.filter(doc => doc.driver_id === d.id);
          return docs.some(doc => doc.status === 'expiring');
        });
        break;
      case 'expired':
        result = result.filter(d => {
          if (d.status !== 'active' && d.status !== 'inactive') return false;
          const docs = documents.filter(doc => doc.driver_id === d.id);
          return docs.some(doc => doc.status === 'expired');
        });
        break;
      case 'inactive':
        result = result.filter(d => d.status === 'inactive' || d.status === 'on_leave');
        break;
      case 'archive':
        result = result.filter(d => d.status === 'terminated');
        break;
      default:
        result = result.filter(d => d.status !== 'terminated');
    }

    // Step 2: Nationality filter
    if (filters.nationalityFilter !== 'all') {
      result = result.filter(d => d.nationality_group === filters.nationalityFilter);
    }

    // Step 3: Search
    if (filters.search) {
      const term = filters.search.toLowerCase();
      result = result.filter(d =>
        (d.name || '').toLowerCase().includes(term) ||
        (formatDriverId(d) || '').toLowerCase().includes(term) ||
        (d.phone || '').toLowerCase().includes(term)
      );
    }

    // Step 4: Sort
    result.sort((a, b) => {
      if (filters.sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (filters.sortBy === 'readiness') return (b.trip_readiness_pct || 0) - (a.trip_readiness_pct || 0);
      return 0;
    });

    return result;
  }, [drivers, documents, filters]);

  const handleSaveDriver = async (savedDriver) => {
    setIsCreating(false);
    if (savedDriver) {
      await Promise.all([refetch(), refetchDocuments()]);
      setSelectedDriver(savedDriver);
    } else {
      setSelectedDriver(null);
    }
  };

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      <Toaster position="top-right" duration={3000} />
      {/* Header + filters */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="w-full px-6 py-4">
          <DriverFilters
            filters={filters}
            setFilters={setFilters}
            counts={counts}
            onCreateDriver={() => { setSelectedDriver(null); setIsCreating(true); }}
          />
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
            onSelectDriver={(d) => { setSelectedDriver(d); setIsCreating(false); }}
            isLoading={isLoading}
          />
        </div>

        {/* Right: Driver detail panel */}
        <div className="w-[40%] min-w-0 flex flex-col min-h-0">
          <DriverDetail
            driver={isCreating ? null : selectedDriver}
            onSave={handleSaveDriver}
            documents={selectedDocuments}
            isCreating={isCreating}
            onCreateDriver={() => { setSelectedDriver(null); setIsCreating(true); }}
          />
        </div>
      </div>
    </div>
  );
}