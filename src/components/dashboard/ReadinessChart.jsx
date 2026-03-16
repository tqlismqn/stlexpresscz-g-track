import React from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

export default function ReadinessChart({ drivers }) {
  const readyCount = drivers.filter(d => d.trip_readiness_pct === 100).length;
  const notReadyCount = drivers.length - readyCount;

  const data = [
    { name: 'Готовы к рейсу', value: readyCount, fill: '#10b981' },
    { name: 'Не готовы', value: notReadyCount, fill: '#ef4444' }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Готовность к рейсу</h2>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}