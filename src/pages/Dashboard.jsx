import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import StatCard from '@/components/dashboard/StatCard';
import ExpiringDocumentsWidget from '@/components/dashboard/ExpiringDocumentsWidget';
import ReadinessChart from '@/components/dashboard/ReadinessChart';
import { Users, AlertCircle, Clock, XCircle } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeDrivers: 0,
    readyDrivers: 0,
    expiringDocs: 0,
    expiredDocs: 0,
    breakdown: ''
  });
  const [drivers, setDrivers] = useState([]);
  const [activeDrivers, setActiveDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const driversList = await base44.entities.Driver.list();
        setDrivers(driversList);

        const active = driversList.filter(d => d.status === 'active');
        setActiveDrivers(active);

        const docsList = await base44.entities.DriverDocument.list();
        const activeDriverIds = new Set(active.map(d => d.id));

        const activeCount = active.length;
        const readyCount = active.filter(d => d.trip_readiness_pct === 100).length;
        const expiringCount = docsList.filter(d => d.status === 'expiring' && activeDriverIds.has(d.driver_id)).length;
        const expiredCount = docsList.filter(d => d.status === 'expired' && activeDriverIds.has(d.driver_id)).length;

        const onLeave = driversList.filter(d => d.status === 'on_leave').length;
        const inactive = driversList.filter(d => d.status === 'inactive').length;
        const terminated = driversList.filter(d => d.status === 'terminated').length;

        const breakdownParts = [];
        if (activeCount > 0) breakdownParts.push(`${activeCount} активных`);
        if (onLeave > 0) breakdownParts.push(`${onLeave} в отпуске`);
        if (inactive > 0) breakdownParts.push(`${inactive} неакт.`);
        if (terminated > 0) breakdownParts.push(`${terminated} архив`);

        setStats({
          activeDrivers: activeCount,
          readyDrivers: readyCount,
          expiringDocs: expiringCount,
          expiredDocs: expiredCount,
          breakdown: breakdownParts.join(' · ')
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Загрузка...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full px-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Панель</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Активных водителей"
            value={stats.activeDrivers}
            icon={Users}
            color="blue"
            breakdown={stats.breakdown}
            onClick={() => navigate('/Drivers')}
          />
          <StatCard
            title="Готовы к рейсу"
            value={stats.readyDrivers}
            icon={AlertCircle}
            color="green"
            onClick={() => navigate('/Drivers?filter=ready')}
          />
          <StatCard
            title="Истекающие документы"
            value={stats.expiringDocs}
            icon={Clock}
            color="orange"
            onClick={() => navigate('/Drivers?filter=expiring')}
          />
          <StatCard
            title="Просроченные"
            value={stats.expiredDocs}
            icon={XCircle}
            color="red"
            onClick={() => navigate('/Drivers?filter=expired')}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <ExpiringDocumentsWidget activeDrivers={activeDrivers} />
          </div>
          <div>
            <ReadinessChart drivers={activeDrivers} />
          </div>
        </div>
      </div>
    </div>
  );
}