import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

const actionConfig = {
  created: { icon: '🟢', color: 'text-green-600', label: 'created' },
  updated: { icon: '✏️', color: 'text-blue-600', label: 'updated' },
  status_changed: { icon: '🔄', color: 'text-amber-600', label: 'status_changed' },
  archived: { icon: '📦', color: 'text-red-600', label: 'archived' },
  restored: { icon: '♻️', color: 'text-green-600', label: 'restored' },
  comment_added: { icon: '💬', color: 'text-gray-600', label: 'comment_added' },
  comment_deleted: { icon: '🗑️', color: 'text-red-600', label: 'comment_deleted' }
};

export default function DriverHistoryTab({ driver }) {
  const { t } = useTranslation();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!driver?.id) return;
    loadHistory();
  }, [driver?.id]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await base44.entities.DriverHistory.filter({ driver_id: driver.id });
      setHistory(data.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Загрузка...</div>;
  }

  if (history.length === 0) {
    return <div className="text-center py-8 text-gray-500">Нет записей</div>;
  }

  return (
    <div className="space-y-4">
      {history.map((entry, idx) => {
        const config = actionConfig[entry.action];
        const showValues = entry.old_value || entry.new_value;

        return (
          <div key={entry.id} className="relative">
            {/* Timeline line */}
            {idx < history.length - 1 && (
              <div className="absolute left-3.5 top-8 w-0.5 h-12 bg-gray-200"></div>
            )}

            {/* Entry */}
            <div className="flex gap-3">
              {/* Dot */}
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${config.color}`}></div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-4">
                <p className="font-medium text-gray-900 text-sm">
                  {config.icon} {entry.description}
                </p>
                {showValues && (
                  <p className={`text-xs mt-1 ${entry.action === 'comment_deleted' ? 'text-gray-500 italic' : 'text-gray-600'}`}>
                    {entry.old_value && entry.new_value ? (
                      <>{entry.old_value} → {entry.new_value}</>
                    ) : entry.new_value ? (
                      <>{entry.new_value}</>
                    ) : (
                      <>{entry.old_value}</>
                    )}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {entry.changed_by} · {format(new Date(entry.created_date), 'dd.MM.yyyy HH:mm')}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}