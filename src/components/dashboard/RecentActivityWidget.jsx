import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Activity, FileEdit, RefreshCw, UserPlus, FilePlus, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const DriverHistory = base44.entities.DriverHistory;

function getActionIcon(action) {
  switch (action) {
    case 'document_updated':
    case 'document_renewed':
      return <FileEdit className="w-4 h-4 text-amber-600" />;
    case 'status_changed':
    case 'archived':
    case 'restored':
      return <RefreshCw className="w-4 h-4 text-blue-600" />;
    case 'created':
      return <UserPlus className="w-4 h-4 text-green-600" />;
    case 'document_created':
      return <FilePlus className="w-4 h-4 text-green-600" />;
    default:
      return <Clock className="w-4 h-4 text-gray-400" />;
  }
}

function getIconBg(action) {
  switch (action) {
    case 'document_updated':
    case 'document_renewed':
      return 'bg-amber-100';
    case 'status_changed':
    case 'archived':
    case 'restored':
      return 'bg-blue-100';
    case 'created':
    case 'document_created':
      return 'bg-green-100';
    default:
      return 'bg-gray-100';
  }
}

function formatTimeAgo(dateString, t) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  const formattedDate = date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

  let relative;
  if (diffMins < 60) {
    relative = `${diffMins} ${t('dashboard.min_short')}`;
  } else if (diffHours < 24) {
    relative = `${diffHours}${t('dashboard.hour_short')}`;
  } else {
    relative = `${diffDays}${t('dashboard.day_short')}`;
  }

  return `${formattedDate} (${relative})`;
}

export default function RecentActivityWidget({ drivers = [], companyId }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const driverMap = new Map(drivers.map(d => [d.id, d]));

  useEffect(() => {
    if (!companyId) return;
    const load = async () => {
      try {
        const records = await DriverHistory.filter({ company_id: companyId }, '-created_date', 10);
        setActivities(records);
      } catch (err) {
        console.error('Failed to load DriverHistory:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [companyId]);

  if (loading) {
    return <div className="bg-white rounded-lg shadow p-6">{t('common.loading')}</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.recent_activity')}</h2>
      </div>

      <div className="space-y-1 max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">{t('dashboard.no_recent_activity')}</p>
        ) : (
          activities.map(activity => {
            const driver = driverMap.get(activity.driver_id);
            const driverName = driver?.name || t('dashboard.unknown_driver');

            return (
              <div
                key={activity.id}
                onClick={() => navigate(`/Drivers?select=${activity.driver_id}`)}
                className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getIconBg(activity.action)}`}>
                  {getActionIcon(activity.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    {activity.description || t('dashboard.activity_default', {
                      user: activity.changed_by || '—',
                      driver: driverName,
                    })}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    {driverName && driverName !== '—' && (
                      <>
                        <span className="font-medium text-gray-700">{driverName}</span>
                        <span>·</span>
                      </>
                    )}
                    <span>{formatTimeAgo(activity.created_date, t)}</span>
                    {activity.changed_by && (
                      <>
                        <span>·</span>
                        <span>{activity.changed_by}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}