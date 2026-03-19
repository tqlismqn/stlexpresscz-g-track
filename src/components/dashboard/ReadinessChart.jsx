import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react';

export default function ReadinessChart({ activeDrivers = [] }) {
  const { t } = useTranslation();
  
  const groups = useMemo(() => {
    const total = activeDrivers.length || 1;
    const ready100 = activeDrivers.filter(d => d.trip_readiness_pct === 100).length;
    const ready80 = activeDrivers.filter(d => d.trip_readiness_pct >= 80 && d.trip_readiness_pct < 100).length;
    const ready50 = activeDrivers.filter(d => d.trip_readiness_pct >= 50 && d.trip_readiness_pct < 80).length;
    const readyLow = activeDrivers.filter(d => (d.trip_readiness_pct || 0) < 50).length;
    
    return [
      { label: t('dashboard.readiness_100'), count: ready100, color: 'bg-green-500', textColor: 'text-green-700', pct: (ready100/total)*100 },
      { label: t('dashboard.readiness_80'), count: ready80, color: 'bg-lime-500', textColor: 'text-lime-700', pct: (ready80/total)*100 },
      { label: t('dashboard.readiness_50'), count: ready50, color: 'bg-orange-400', textColor: 'text-orange-700', pct: (ready50/total)*100 },
      { label: t('dashboard.readiness_low'), count: readyLow, color: 'bg-red-500', textColor: 'text-red-700', pct: (readyLow/total)*100 },
    ];
  }, [activeDrivers, t]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
        <ShieldCheck className="w-5 h-5 text-green-600" />
        {t('dashboard.trip_readiness')}
      </h2>
      <div className="space-y-3">
        {groups.map((g, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${g.color}`} />
                <span className="text-sm text-gray-600">{g.label}</span>
              </div>
              <span className={`text-sm font-semibold ${g.textColor}`}>{g.count}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full ${g.color} rounded-full transition-all`} style={{ width: `${Math.max(g.pct, g.count > 0 ? 2 : 0)}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t text-center">
        <span className="text-2xl font-bold text-gray-800">{activeDrivers.length}</span>
        <span className="text-sm text-gray-500 ml-1">{t('dashboard.total_drivers_short')}</span>
      </div>
    </div>
  );
}