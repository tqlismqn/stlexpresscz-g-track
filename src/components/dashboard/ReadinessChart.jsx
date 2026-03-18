import React from 'react';
import { PieChart, Pie, Cell, Label, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

export default function ReadinessChart({ drivers }) {
  const { t } = useTranslation();
  const readyCount = drivers.filter(d => d.trip_readiness_pct === 100).length;
  const notReadyCount = drivers.length - readyCount;
  const totalCount = drivers.length;

  const data = [
    { name: t('dashboard.ready'), value: readyCount, fill: '#22c55e' },
    { name: t('dashboard.not_ready'), value: notReadyCount, fill: '#ef4444' }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.trip_readiness')}</h2>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
            <Label
              value={totalCount}
              position="center"
              fontSize={28}
              fontWeight="bold"
              fill="#1f2937"
            />
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>{t('dashboard.ready_count', { count: readyCount })}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>{t('dashboard.not_ready_count', { count: notReadyCount })}</span>
        </div>
      </div>
    </div>
  );
}