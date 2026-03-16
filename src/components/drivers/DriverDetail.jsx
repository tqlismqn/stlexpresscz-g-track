import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Edit2, Plus } from 'lucide-react';
import DriverDetailView from './DriverDetailView';
import DriverDetailEdit from './DriverDetailEdit';
import DriverDocumentsSection from './DriverDocumentsSection';

export default function DriverDetail({ driver, editMode, onEditModeChange, onSave, documents }) {
  const [showCreateForm, setShowCreateForm] = useState(false);

  if (!driver && !showCreateForm) {
    return (
      <div className="bg-white rounded-lg shadow p-6 h-[calc(100vh-200px)] flex flex-col items-center justify-center">
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
    <div className="bg-white rounded-lg shadow overflow-hidden h-[calc(100vh-200px)] flex flex-col">
      <div className="p-6 border-b">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-gray-900">{driver?.name}</h3>
          {!editMode && (
            <button
              onClick={() => onEditModeChange(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              <Edit2 className="w-4 h-4" />
              Изменить
            </button>
          )}
        </div>

        {editMode ? (
          <DriverDetailEdit
            driver={driver}
            onSave={async () => {
              await onSave();
              onEditModeChange(false);
            }}
            onCancel={() => onEditModeChange(false)}
          />
        ) : (
          <DriverDetailView driver={driver} />
        )}
      </div>

      {!editMode && (
        <div className="flex-1 overflow-y-auto">
          <DriverDocumentsSection documents={documents} driver={driver} />
        </div>
      )}
    </div>
  );
}