import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Toaster } from 'sonner';
import { AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMembership } from '@/lib/MembershipContext';
import { hasPermission } from '@/lib/permissions';
import { useQuery } from '@tanstack/react-query';
import DriverList from '@/components/drivers/DriverList';
import DriverDetail from '@/components/drivers/DriverDetail';
import DriverFilters from '@/components/drivers/DriverFilters';
import FloatingExportToolbar from '@/components/drivers/FloatingExportToolbar';
import { formatDriverId } from '@/lib/driverUtils';
import { generateCSV, downloadCSV, generateAndDownloadPDF } from '@/utils/exportHelpers';

export default function Drivers() {
  const location = useLocation();
  const { t } = useTranslation();
  const { permissions } = useMembership();
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [filters, setFilters] = useState({
    statusFilter: 'all',
    nationalityFilter: 'all',
    search: '',
    sortBy: 'name'
  });
  const [docTypeFilter, setDocTypeFilter] = useState('all');
  const [docStatusFilter, setDocStatusFilter] = useState('any');
  const [visaTypeFilter, setVisaTypeFilter] = useState('any');
  const [a1SwitzerlandFilter, setA1SwitzerlandFilter] = useState(false);
  const [pendingReturnFilter, setPendingReturnFilter] = useState(false);
  const [selectedDriverIds, setSelectedDriverIds] = useState(new Set());

  const [selectedTab, setSelectedTab] = useState('overview');

  const { data: drivers = [], isLoading, refetch } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => base44.entities.Driver.list()
  });

  const { data: documents = [], refetch: refetchDocuments } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.DriverDocument.list()
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filterParam = params.get('filter');
    const selectParam = params.get('select');
    const tabParam = params.get('tab');

    if (filterParam && ['ready', 'expiring', 'expired'].includes(filterParam)) {
      setFilters(prev => ({ ...prev, statusFilter: filterParam }));
    }

    if (selectParam) {
      const driverToSelect = drivers.find(d => d.id === selectParam);
      if (driverToSelect) {
        setSelectedDriver(driverToSelect);
        setIsCreating(false);
      }
    }

    if (tabParam) {
      setSelectedTab(tabParam);
    }
  }, [location.search, drivers]);

  const counts = useMemo(() => {
    if (!drivers.length) return { all: 0, ready: 0, incomplete: 0, expiring: 0, expired: 0, inactive: 0, archive: 0 };

    let src = drivers;
    if (filters.nationalityFilter !== 'all') {
      src = src.filter(d => d.nationality_group === filters.nationalityFilter);
    }

    const active     = src.filter(d => d.status === 'active');
    const candidates = src.filter(d => d.status === 'candidate');
    const nonArchived = src.filter(d => d.status !== 'archived');

    const hasDocs = (driver, statuses) => {
      const docs = documents.filter(doc => doc.driver_id === driver.id);
      return docs.some(doc => statuses.includes(doc.status));
    };

    return {
      all:        nonArchived.length,
      candidates: candidates.length,
      ready:      active.filter(d => d.trip_readiness_pct === 100).length,
      incomplete: active.filter(d => {
        if (d.trip_readiness_pct === 100) return false;
        const docs = documents?.filter(doc => doc.driver_id === d.id) || [];
        const hasExpired = docs.some(doc => doc.status === 'expired');
        const hasExpiring = docs.some(doc => doc.status === 'expiring');
        return !hasExpired && !hasExpiring;
      }).length,
      expiring: active.filter(d => hasDocs(d, ['expiring'])).length,
      expired:  active.filter(d => hasDocs(d, ['expired'])).length,
      archived: src.filter(d => d.status === 'archived').length,
      eu:       src.filter(d => d.status !== 'archived' && d.nationality_group === 'EU').length,
      nonEu:    src.filter(d => d.status !== 'archived' && d.nationality_group === 'non-EU').length,
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
        result = result.filter(d => d.status !== 'archived');
        break;
      case 'candidates':
        result = result.filter(d => d.status === 'candidate');
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
          if (d.status !== 'active') return false;
          const docs = documents.filter(doc => doc.driver_id === d.id);
          return docs.some(doc => doc.status === 'expiring');
        });
        break;
      case 'expired':
        result = result.filter(d => {
          if (d.status !== 'active') return false;
          const docs = documents.filter(doc => doc.driver_id === d.id);
          return docs.some(doc => doc.status === 'expired');
        });
        break;
      case 'archived':
        result = result.filter(d => d.status === 'archived');
        break;
      default:
        result = result.filter(d => d.status !== 'archived');
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

    // Step 4: Document type + status filter
    if (docTypeFilter !== 'all') {
      result = result.filter(driver => {
        const driverDocs = documents.filter(d => d.driver_id === driver.id);
        const matchingDoc = driverDocs.find(d => {
          if (docTypeFilter === 'transport_licence') {
            return d.document_type === 'transport_licence' || d.document_type === 'licence';
          }
          return d.document_type === docTypeFilter;
        });

        // Visa type sub-filter: only applies when docTypeFilter === 'visa'
        if (docTypeFilter === 'visa' && visaTypeFilter !== 'any') {
          if (driver.visa_type !== visaTypeFilter) return false;
        }

        // A1 Switzerland sub-filter
        if (docTypeFilter === 'a1_certificate' && a1SwitzerlandFilter) {
          if (!matchingDoc || !matchingDoc.a1_switzerland) return false;
        }

        if (docStatusFilter === 'missing') return !matchingDoc;
        if (!matchingDoc) return false;
        if (docStatusFilter === 'any') return true;
        // No expiry date = indefinite = valid
        if (!matchingDoc.expiry_date) return docStatusFilter === 'valid';

        const daysUntilExpiry = Math.ceil((new Date(matchingDoc.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
        switch (docStatusFilter) {
          case 'expired':     return daysUntilExpiry < 0;
          case 'expiring_30': return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
          case 'expiring_60': return daysUntilExpiry >= 0 && daysUntilExpiry <= 60;
          case 'expiring_90': return daysUntilExpiry >= 0 && daysUntilExpiry <= 90;
          case 'valid':       return daysUntilExpiry > 30;
          default:            return true;
        }
      });
    }

    // Step 4b: Standalone A1 Switzerland filter (when no doc type filter active)
    if (docTypeFilter === 'all' && a1SwitzerlandFilter) {
      result = result.filter(driver => {
        return documents.some(d => d.driver_id === driver.id && d.document_type === 'a1_certificate' && d.a1_switzerland);
      });
    }

    // Step 4c: Pending return filter
    if (pendingReturnFilter) {
      result = result.filter(driver => {
        return documents.some(d => d.driver_id === driver.id && d.return_status === 'pending_return');
      });
    }

    // Step 5: Sort
    result.sort((a, b) => {
      if (filters.sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (filters.sortBy === 'readiness') return (b.trip_readiness_pct || 0) - (a.trip_readiness_pct || 0);
      return 0;
    });

    return result;
  }, [drivers, documents, filters, docTypeFilter, docStatusFilter, visaTypeFilter, a1SwitzerlandFilter, pendingReturnFilter]);

  const toggleSelect = (driverId) => {
    setSelectedDriverIds(prev => {
      const next = new Set(prev);
      if (next.has(driverId)) next.delete(driverId);
      else next.add(driverId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedDriverIds(new Set());
    } else {
      setSelectedDriverIds(new Set(filteredDrivers.map(d => d.id)));
    }
  };

  const clearSelection = () => setSelectedDriverIds(new Set());

  const handleExportPDF = async (templateKey) => {
    const driversToExport = selectedDriverIds.size > 0
      ? filteredDrivers.filter(d => selectedDriverIds.has(d.id))
      : filteredDrivers;
    await generateAndDownloadPDF(driversToExport, documents, templateKey, t);
  };

  const handleExportCSV = (templateKey) => {
    const driversToExport = selectedDriverIds.size > 0
      ? filteredDrivers.filter(d => selectedDriverIds.has(d.id))
      : filteredDrivers;
    const csvString = generateCSV(driversToExport, documents, templateKey, t);
    downloadCSV(csvString, templateKey);
  };

  const isAllSelected = selectedDriverIds.size === filteredDrivers.length && filteredDrivers.length > 0;

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
            permissions={permissions}
            filters={filters}
            setFilters={(val) => { setFilters(val); clearSelection(); }}
            counts={counts}
            onCreateDriver={() => { setSelectedDriver(null); setIsCreating(true); }}
            docTypeFilter={docTypeFilter}
            docStatusFilter={docStatusFilter}
            onDocTypeChange={(val) => { setDocTypeFilter(val); if (val !== 'visa') setVisaTypeFilter('any'); clearSelection(); }}
            onDocStatusChange={(val) => { setDocStatusFilter(val); clearSelection(); }}
            visaTypeFilter={visaTypeFilter}
            onVisaTypeChange={(val) => { setVisaTypeFilter(val); clearSelection(); }}
            a1SwitzerlandFilter={a1SwitzerlandFilter}
            onA1SwitzerlandChange={(val) => { setA1SwitzerlandFilter(val); clearSelection(); }}
            pendingReturnFilter={pendingReturnFilter}
            onPendingReturnChange={(val) => { setPendingReturnFilter(val); clearSelection(); }}
            onDocTypeChange={(val) => { setDocTypeFilter(val); if (val !== 'visa') setVisaTypeFilter('any'); if (val !== 'transport_licence') setPendingReturnFilter(false); clearSelection(); }}
            isAllSelected={isAllSelected}
            onToggleSelectAll={toggleSelectAll}
            hasFilteredResults={filteredDrivers.length > 0}
            filteredCount={filteredDrivers.length}
            totalCount={drivers.filter(d => d.status !== 'archived').length}
            onExportCSV={handleExportCSV}
            onExportPDF={handleExportPDF}
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
            selectedDriverIds={selectedDriverIds}
            onToggleSelect={toggleSelect}
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
            initialTab={selectedTab}
          />
        </div>
      </div>

      <AnimatePresence>
        {selectedDriverIds.size > 0 && (
          <FloatingExportToolbar
            selectedCount={selectedDriverIds.size}
            onClearSelection={clearSelection}
            onExportCSV={handleExportCSV}
            onExportPDF={handleExportPDF}
          />
        )}
      </AnimatePresence>
    </div>
  );
}