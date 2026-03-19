import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import StatCard from '@/components/dashboard/StatCard';
import ExpiringDocumentsWidget from '@/components/dashboard/ExpiringDocumentsWidget';
import ReadinessChart from '@/components/dashboard/ReadinessChart';
import { Users, AlertCircle, Clock, XCircle, UserPlus, Download, RefreshCw } from 'lucide-react';
import RecentActivityWidget from '@/components/dashboard/RecentActivityWidget';
import DocumentStatsWidget from '@/components/dashboard/DocumentStatsWidget';
import { format } from 'date-fns';
import { enUS, ru, cs } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

const dateLocales = { en: enUS, ru, cs };

export default function Dashboard() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  const loadData = async () => {
    setLoading(true);
    try {
      const driversList = await base44.entities.Driver.list();
      setDrivers(driversList);

      const active = driversList.filter(d => d.status === 'active');
      setActiveDrivers(active);

      const docsList = await base44.entities.DriverDocument.list();
      setDocuments(docsList);
      const activeDriverIds = new Set(active.map(d => d.id));

      const activeCount = active.length;
      const readyCount = active.filter(d => d.trip_readiness_pct === 100).length;
      const expiringCount = docsList.filter(d => d.status === 'expiring' && activeDriverIds.has(d.driver_id)).length;
      const expiredCount = docsList.filter(d => d.status === 'expired' && activeDriverIds.has(d.driver_id)).length;

      const onLeave = driversList.filter(d => d.status === 'on_leave').length;
      const inactive = driversList.filter(d => d.status === 'inactive').length;
      const terminated = driversList.filter(d => d.status === 'terminated').length;

      const breakdownParts = [];
      if (activeCount > 0) breakdownParts.push(t('dashboard.active_count', { count: activeCount }));
      if (onLeave > 0) breakdownParts.push(t('dashboard.on_leave_count', { count: onLeave }));
      if (inactive > 0) breakdownParts.push(t('dashboard.inactive_short', { count: inactive }));
      if (terminated > 0) breakdownParts.push(t('dashboard.archived_short', { count: terminated }));

      setStats({
        activeDrivers: activeCount,
        readyDrivers: readyCount,
        expiringDocs: expiringCount,
        expiredDocs: expiredCount,
        breakdown: breakdownParts.join(' · ')
      });
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  const dateLocale = dateLocales[i18n.language] || enUS;
  const [stats, setStats] = useState({
    activeDrivers: 0,
    readyDrivers: 0,
    expiringDocs: 0,
    expiredDocs: 0,
    breakdown: ''
  });
  const [drivers, setDrivers] = useState([]);
  const [activeDrivers, setActiveDrivers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadData();
  }, [t]);

  if (loading) {
    return <div className="p-8 text-center">{t('common.loading')}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full px-6">
        <div className="flex items-start justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('nav.dashboard')}</h1>
          <div className="text-right">
            <p className="text-sm text-gray-500">{format(new Date(), "EEEE, dd MMMM yyyy", { locale: dateLocale })}</p>
            {lastUpdated && (
              <p className="text-xs text-gray-400">{t('dashboard.updated_at')} {format(lastUpdated, 'HH:mm')}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title={t('dashboard.active_drivers')}
            value={stats.activeDrivers}
            icon={Users}
            color="blue"
            breakdown={stats.breakdown}
            onClick={() => navigate('/Drivers')}
          />
          <StatCard
            title={t('dashboard.ready_for_trip')}
            value={stats.readyDrivers}
            icon={AlertCircle}
            color="green"
            onClick={() => navigate('/Drivers?filter=ready')}
          />
          <StatCard
            title={t('dashboard.expiring_documents')}
            value={stats.expiringDocs}
            icon={Clock}
            color="orange"
            onClick={() => navigate('/Drivers?filter=expiring')}
          />
          <StatCard
            title={t('dashboard.expired_documents')}
            value={stats.expiredDocs}
            icon={XCircle}
            color="red"
            onClick={() => navigate('/Drivers?filter=expired')}
          />
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={() => navigate('/Drivers?create=true')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            {t('dashboard.add_driver')}
          </button>
          <button
            onClick={() => navigate('/Drivers')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            {t('dashboard.export')}
          </button>
          <button
            onClick={() => loadData()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {t('dashboard.refresh')}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 items-start">
          <ExpiringDocumentsWidget activeDrivers={activeDrivers} />
          <RecentActivityWidget drivers={drivers} />
          <ReadinessChart drivers={activeDrivers} />
        </div>

        <div className="mt-6">
          <DocumentStatsWidget documents={documents} activeDriverIds={activeDrivers.map(d => d.id)} />
        </div>
      </div>
    </div>
  );
}