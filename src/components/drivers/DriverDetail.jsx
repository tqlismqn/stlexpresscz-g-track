import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus } from 'lucide-react';
import DriverDetailView from './DriverDetailView';

export default function DriverDetail({ driver, onSave, documents, isCreating }) {
  const [showCreateForm, setShowCreateForm] = useState(false);

  if (!driver && !showCreateForm && !isCreating) {
    return (
      <div className="bg-white rounded-lg shadow p-6 h-full flex flex-col items-center justify-center overflow-y-auto">
        <p className="text-gray-500">Выберите водителя или создайте нового</p>
        <button
          onClick={() => setShowCreateForm(true)}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Создать водителя
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden h-full flex flex-col">
      <DriverDetailView driver={driver} documents={documents} onSave={onSave} />
    </div>
  );
}