import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus } from 'lucide-react';
import DriverDetailView from './DriverDetailView';

export default function DriverDetail({ driver, editMode, onEditModeChange, onSave, documents }) {
  const [showCreateForm, setShowCreateForm] = useState(false);

  if (!driver && !showCreateForm) {
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

  if (showCreateForm && !driver) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4 text-gray-900">Создать новго водителя</h3>
        <DriverDetailEdit
          driver={null}
          onSave={async () => {
            await onSave();
            setShowCreateForm(false);
          }}
          onCancel={() => setShowCreateForm(false)}
          isCreating={true}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden h-full flex flex-col">
      {editMode && (
        <div className="p-6 border-b flex justify-between items-start">
          <h3 className="text-lg font-bold text-gray-900">{driver?.name}</h3>
        </div>
      )}
      {editMode ? (
        <div className="p-6 overflow-y-auto flex-1">
          <DriverDetailEdit
            driver={driver}
            onSave={async () => {
              await onSave();
              onEditModeChange(false);
            }}
            onCancel={() => onEditModeChange(false)}
          />
        </div>
      ) : (
        <DriverDetailView driver={driver} documents={documents} onEditModeChange={onEditModeChange} />
      )}
    </div>
  );
}