import React from 'react';
import { PieChart, Pie, Cell, Label, Tooltip, ResponsiveContainer } from 'recharts';

export default function ReadinessChart({ drivers }) {
  const readyCount = drivers.filter(d => d.trip_readiness_pct === 100).length;
  const notReadyCount = drivers.length - readyCount;
  const totalCount = drivers.length;

  const data = [
    { name: 'Готовы к рейсу', value: readyCount, fill: '#22c55e' },
    { name: 'Не готовы', value: notReadyCount, fill: '#ef4444' }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Готовность к рейсу</h2>
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
          <span>Готовы {readyCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Не готовы {notReadyCount}</span>
        </div>
      </div>
    </div>
  );
}