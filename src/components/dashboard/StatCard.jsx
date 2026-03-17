import React from 'react';

const colorMap = {
  blue: 'bg-blue-100 text-blue-700 border-l-blue-500',
  green: 'bg-green-100 text-green-700 border-l-green-500',
  orange: 'bg-orange-100 text-orange-700 border-l-amber-500',
  red: 'bg-red-100 text-red-700 border-l-red-500'
};

export default function StatCard({ title, value, icon: Icon, color, breakdown, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-lg shadow border-l-4 rounded-l-none p-4 ${colorMap[color]} ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-105 transition-all' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {breakdown && <p className="text-xs text-gray-400 mt-2">{breakdown}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colorMap[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}