import React, { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { DOCUMENT_TYPES, SECTIONS, VISA_TYPES, formatDate, getRemainingDays } from '@/lib/documentTypes';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const DriverDocument = base44.entities.DriverDocument;

const STATUS_DOT = {
  valid: 'bg-green-500',
  expiring: 'bg-yellow-500',
  expired: 'bg-red-500',
  missing: 'bg-gray-300',
  pending_renewal: 'bg-blue-500',
};

function RemainingDays({ expiryDate }) {
  if (!expiryDate) return null;
  const days = getRemainingDays(expiryDate);
  if (days === null) return null;
  if (days < 0) return <span className="text-red-600 font-medium">Просрочено на {Math.abs(days)} дн.</span>;
  if (days <= 30) return <span className="text-yellow-600 font-medium">Осталось {days} дн.</span>;
  return <span className="text-gray-500">Осталось {days} дн.</span>;
}

function DateInput({ value, onChange, placeholder = 'ДД.ММ.ГГГГ' }) {
  const isoToDisplay = (iso) => {
    if (!iso) return '';
    return formatDate(iso);
  };

  const [display, setDisplay] = useState(isoToDisplay(value));

  useEffect(() => { setDisplay(isoToDisplay(value)); }, [value]);

  const handleChange = (e) => {
    let val = e.target.value.replace(/[^\d.]/g, '');
    if (val.length === 2 && !val.includes('.')) val += '.';
    if (val.length === 5 && val.split('.').length === 2) val += '.';
    if (val.length > 10) val = val.slice(0, 10);
    setDisplay(val);
    const match = val.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (match) {
      const [, dd, mm, yyyy] = match;
      onChange(`${yyyy}-${mm}-${dd}`);
    }
  };

  return <Input type="text" placeholder={placeholder} value={display} onChange={handleChange} className="h-7 text-xs" />;
}

function DocumentRow({ docType, config, doc }) {
  const status = doc?.status || 'missing';
  const dotColor = STATUS_DOT[status] || 'bg-gray-300';
  const fromStr = doc?.issue_date ? formatDate(doc.issue_date) : '—';
  const toStr = (!doc?.expiry_date && config.indefiniteByDefault)
    ? 'na dobu neurčitou'
    : (doc?.expiry_date ? formatDate(doc.expiry_date) : '—');

  return (
    <div className="flex items-start gap-3 py-2">
      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${dotColor}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-medium text-gray-900">{config.name}</span>
          <span className="text-xs text-gray-400">({config.abbr})</span>
        </div>
        {doc ? (
          <div className="text-xs text-gray-500 mt-0.5">
            {doc.document_number ? `№${doc.document_number} · ` : ''}
            {fromStr} → {toStr}
          </div>
        ) : (
          <div className="text-xs text-gray-400 mt-0.5">Нет данных</div>
        )}
      </div>
      <div className="text-xs text-right flex-shrink-0 min-w-[80px]">
        {doc && <RemainingDays expiryDate={doc.expiry_date} />}
      </div>
    </div>
  );
}

function DocumentEditRow({ docType, config, editDocs, handleDocFieldChange }) {
  const data = editDocs[docType] || {};

  return (
    <div className="py-2 space-y-1.5">
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-medium text-gray-900">{config.name}</span>
        <span className="text-xs text-gray-400">({config.abbr})</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {config.hasNumber && (
          <div>
            <label className="text-[10px] text-gray-400">Номер</label>
            <Input
              value={data.document_number || ''}
              onChange={(e) => handleDocFieldChange(docType, 'document_number', e.target.value)}
              className="h-7 text-xs"
              placeholder="—"
            />
          </div>
        )}
        {config.hasFrom && (
          <div>
            <label className="text-[10px] text-gray-400">От</label>
            <DateInput
              value={data.issue_date || ''}
              onChange={(val) => handleDocFieldChange(docType, 'issue_date', val)}
            />
          </div>
        )}
        {config.hasTo && (
          <div>
            <label className="text-[10px] text-gray-400">До</label>
            <DateInput
              value={data.expiry_date || ''}
              onChange={(val) => handleDocFieldChange(docType, 'expiry_date', val)}
              placeholder={config.indefiniteByDefault ? 'neurčitou' : 'ДД.ММ.ГГГГ'}
            />
          </div>
        )}
      </div>

      {config.hasA1CHCheckbox && (
        <div className="flex items-center gap-2 mt-1">
          <Checkbox
            checked={data.a1_ch || false}
            onCheckedChange={(val) => handleDocFieldChange(docType, 'a1_ch', val)}
          />
          <label className="text-xs text-gray-600">A1 CH (Швейцария)</label>
        </div>
      )}

      {config.hasVisaType && (
        <div className="mt-1">
          <label className="text-[10px] text-gray-400">Тип визы</label>
          <Select
            value={data.visa_type || ''}
            onValueChange={(val) => handleDocFieldChange(docType, 'visa_type', val)}
          >
            <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Выберите тип" /></SelectTrigger>
            <SelectContent>
              {VISA_TYPES.map(vt => (
                <SelectItem key={vt.value} value={vt.value}>{vt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

export default function DriverDocumentsTabContent({ driver, documents = [], onDocumentsChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editDocs, setEditDocs] = useState({});

  const isNonEU = driver?.nationality_group === 'non-EU';
  const docsMap = new Map(documents.map(d => [d.document_type, d]));

  const sectionEntries = Object.entries(DOCUMENT_TYPES).reduce((acc, [type, config]) => {
    if (config.nonEUOnly && !isNonEU) return acc;
    if (!acc[config.section]) acc[config.section] = [];
    acc[config.section].push({ type, config });
    return acc;
  }, {});

  const startEditing = () => {
    const docsMapInit = {};
    documents.forEach(doc => {
      docsMapInit[doc.document_type] = { ...doc };
    });
    setEditDocs(docsMapInit);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditDocs({});
    setIsEditing(false);
  };

  const handleDocFieldChange = (docType, field, value) => {
    setEditDocs(prev => ({
      ...prev,
      [docType]: {
        ...(prev[docType] || {}),
        document_type: docType,
        driver_id: driver.id,
        [field]: value,
      }
    }));

    if (docType === 'medical_certificate' && field === 'issue_date' && value) {
      const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (match) {
        const fromDate = new Date(value);
        fromDate.setFullYear(fromDate.getFullYear() + 2);
        const autoTo = fromDate.toISOString().split('T')[0];
        setEditDocs(prev => ({
          ...prev,
          [docType]: { ...prev[docType], document_type: docType, driver_id: driver.id, [field]: value, expiry_date: autoTo }
        }));
      }
    }
  };

  const handleSave = async () => {
    try {
      for (const [docType, docData] of Object.entries(editDocs)) {
        const existingDoc = documents.find(d => d.document_type === docType);
        if (existingDoc) {
          await DriverDocument.update(existingDoc.id, docData);
        } else {
          const hasData = docData.document_number || docData.issue_date || docData.expiry_date;
          if (hasData) {
            await DriverDocument.create({ ...docData, document_type: docType, driver_id: driver.id });
          }
        }
      }
      setIsEditing(false);
      if (onDocumentsChange) onDocumentsChange();
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  return (
    <div className="divide-y divide-gray-100">
      {/* Edit / Save toolbar */}
      <div className="px-4 pt-3 pb-2 flex justify-end">
        {isEditing ? (
          <div className="flex gap-2">
            <button onClick={cancelEditing} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1">Отмена</button>
            <button onClick={handleSave} className="text-sm bg-green-600 text-white px-4 py-1.5 rounded-md hover:bg-green-700">Сохранить</button>
          </div>
        ) : (
          <button onClick={startEditing} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
            <Pencil className="w-3.5 h-3.5" /> Изменить
          </button>
        )}
      </div>

      {[1, 2, 3].map(sectionNum => {
        const items = sectionEntries[sectionNum];
        if (!items || items.length === 0) return null;
        return (
          <div key={sectionNum} className="p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">
              {SECTIONS[sectionNum]}
            </p>
            <div className="divide-y divide-gray-50">
              {items.map(({ type, config }) => (
                isEditing ? (
                  <DocumentEditRow
                    key={type}
                    docType={type}
                    config={config}
                    editDocs={editDocs}
                    handleDocFieldChange={handleDocFieldChange}
                  />
                ) : (
                  <DocumentRow
                    key={type}
                    docType={type}
                    config={config}
                    doc={docsMap.get(type) || null}
                  />
                )
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}