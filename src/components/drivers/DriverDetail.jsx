import React from 'react';
import { Plus } from 'lucide-react';
import DriverDetailView from './DriverDetailView';
import { useTranslation } from 'react-i18next';

export default function DriverDetail({ driver, onSave, documents, isCreating, onCreateDriver, initialTab = 'overview' }) {
  if (!driver && !isCreating) {
    return (
      <div className="bg-white rounded-lg shadow p-6 h-full flex flex-col items-center justify-center overflow-y-auto">
        <p className="text-gray-500">Выберите водителя или создайте нового</p>
        <button
          onClick={onCreateDriver}
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
      <DriverDetailView driver={driver} documents={documents} onSave={onSave} isCreating={isCreating} initialTab={initialTab} />
    </div>
  );
}