import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';

const DriverDocument = base44.entities.DriverDocument;
import { DOCUMENT_TYPES, SECTIONS, VISA_TYPES, formatDate, getRemainingDays } from '@/lib/documentTypes';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil } from 'lucide-react';

const STATUS_COLORS = {
  valid: 'bg-green-500',
  expiring: 'bg-yellow-500',
  expired: 'bg-red-500',
  pending_renewal: 'bg-blue-500',
  missing: 'bg-gray-300',
};

function RemainingDays({ expiryDate }) {
  if (!expiryDate) return null;
  const days = getRemainingDays(expiryDate);
  if (days === null) return null;
  if (days < 0) return <span className="text-red-600 font-medium">Просрочено на {Math.abs(days)} дн.</span>;
  if (days <= 30) return <span className="text-yellow-600 font-medium">Осталось {days} дн.</span>;
  return <span className="text-gray-500">Осталось {days} дн.</span>;
}

const DateInput = ({ value, onChange }) => {
  const isoToDisplay = (iso) => {
    if (!iso) return '';
    return formatDate(iso);
  };

  const handleChange = (e) => {
    let val = e.target.value.replace(/[^\d.]/g, '');
    if (val.length === 2 && !val.includes('.')) val += '.';
    if (val.length === 5 && val.split('.').length === 2) val += '.';
    if (val.length > 10) val = val.slice(0, 10);
    e.target.dataset.display = val;
    const match = val.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (match) {
      const [, dd, mm, yyyy] = match;
      onChange(`${yyyy}-${mm}-${dd}`);
    }
  };

  return (
    <Input
      type="text"
      placeholder="ДД.ММ.ГГГГ"
      defaultValue={isoToDisplay(value)}
      onChange={handleChange}
      className="h-7 text-xs"
    />
  );
};

function DocumentRowRead({ docType, config, doc }) {
  const status = doc?.status || 'missing';
  const dotColor = STATUS_COLORS[status] || 'bg-gray-300';
  const isIndefinite = config.indefiniteByDefault && !doc?.expiry_date;
  const toDisplay = isIndefinite ? 'na dobu neurčitou' : formatDate(doc?.expiry_date);
  const hasDateInfo = doc?.issue_date || doc?.expiry_date || isIndefinite;

  return (
    <div className="flex items-start gap-3 py-2">
      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${dotColor}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-medium text-gray-900">{config.name}</span>
          <span className="text-xs text-gray-400">({config.abbr})</span>
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          {!doc ? (
            <span className="italic text-gray-400">Нет данных</span>
          ) : (
            <>
              {doc.document_number && <span>№{doc.document_number} · </span>}
              {hasDateInfo ? (
                <span>{formatDate(doc?.issue_date)} → {toDisplay}</span>
              ) : (
                <span className="italic text-gray-400">Нет данных</span>
              )}
            </>
          )}
        </div>
      </div>
      <div className="text-xs text-right flex-shrink-0">
        {doc?.expiry_date && !isIndefinite && <RemainingDays expiryDate={doc.expiry_date} />}
      </div>
    </div>
  );
}

function DocumentRowEdit({ docType, config, editDocs, handleDocFieldChange }) {
  return (
    <div className="py-2">
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="text-sm font-medium text-gray-900">{config.name}</span>
        <span className="text-xs text-gray-400">({config.abbr})</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {config.hasNumber && (
          <div>
            <p className="text-[10px] text-gray-400 mb-0.5">Номер</p>
            <Input
              value={editDocs[docType]?.document_number || ''}
              onChange={(e) => handleDocFieldChange(docType, 'document_number', e.target.value)}
              className="h-7 text-xs"
              placeholder="—"
            />
          </div>
        )}
        {config.hasFrom && (
          <div>
            <p className="text-[10px] text-gray-400 mb-0.5">От</p>
            <DateInput
              value={editDocs[docType]?.issue_date || ''}
              onChange={(val) => handleDocFieldChange(docType, 'issue_date', val)}
            />
          </div>
        )}
        {config.hasTo && (
          <div>
            <p className="text-[10px] text-gray-400 mb-0.5">До</p>
            <DateInput
              value={editDocs[docType]?.expiry_date || ''}
              onChange={(val) => handleDocFieldChange(docType, 'expiry_date', val)}
            />
          </div>
        )}
      </div>
      {config.hasVisaType && (
        <div className="mt-1.5">
          <p className="text-[10px] text-gray-400 mb-0.5">Тип визы</p>
          <Select
            value={editDocs[docType]?.visa_type || ''}
            onValueChange={(val) => handleDocFieldChange(docType, 'visa_type', val)}
          >
            <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Выберите тип" /></SelectTrigger>
            <SelectContent>
              {VISA_TYPES.map(vt => <SelectItem key={vt.value} value={vt.value}>{vt.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      {config.hasA1CHCheckbox && (
        <div className="flex items-center gap-2 mt-1.5">
          <Checkbox
            checked={editDocs[docType]?.a1_ch || false}
            onCheckedChange={(val) => handleDocFieldChange(docType, 'a1_ch', val)}
          />
          <span className="text-xs text-gray-600">A1 CH (Швейцария)</span>
        </div>
      )}
    </div>
  );
}

export default function DriverDocumentsTabContent({ driver, documents = [], onDocumentsChange, onEditingChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editDocs, setEditDocs] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDoc, setNewDoc] = useState({ document_type: '', document_number: '', issue_date: '', expiry_date: '', custom_name: '' });

  const isNonEU = driver?.nationality_group === 'non-EU';
  const docsMap = new Map(documents.map(d => [d.document_type, d]));

  const startEditing = () => {
    const map = {};
    documents.forEach(doc => {
      map[doc.document_type] = {
        id: doc.id,
        document_type: doc.document_type,
        document_number: doc.document_number || '',
        issue_date: doc.issue_date || '',
        expiry_date: doc.expiry_date || '',
        visa_type: doc.visa_type || '',
        status: doc.status || '',
      };
    });
    setEditDocs(map);
    setIsEditing(true);
    if (onEditingChange) onEditingChange(true);
  };

  const cancelEditing = () => {
    setEditDocs({});
    setIsEditing(false);
    if (onEditingChange) onEditingChange(false);
  };

  const handleSave = async () => {
    try {
      for (const [docType, docData] of Object.entries(editDocs)) {
        const existingDoc = documents.find(d => d.document_type === docType);
        if (existingDoc) {
          const { id, ...updateData } = docData;
          await DriverDocument.update(existingDoc.id, updateData);
        } else {
          const hasData = docData.document_number || docData.issue_date || docData.expiry_date;
          if (hasData) {
            await DriverDocument.create({
              ...docData,
              document_type: docType,
              driver_id: driver.id,
            });
          }
        }
      }
      setIsEditing(false);
      if (onEditingChange) onEditingChange(false);
      if (onDocumentsChange) onDocumentsChange();
    } catch (error) {
      console.error('Document save failed:', error);
    }
  };

  const handleAddDocument = async () => {
    if (!newDoc.document_type) return;
    try {
      const createPayload = {
        driver_id: driver.id,
        document_type: newDoc.document_type === 'other' ? 'other' : newDoc.document_type,
        document_number: newDoc.document_number || '',
        issue_date: newDoc.issue_date || null,
        expiry_date: newDoc.expiry_date || null,
        status: 'valid',
      };
      if (newDoc.custom_name) createPayload.notes = newDoc.custom_name;
      if (newDoc.visa_type) createPayload.visa_type = newDoc.visa_type;
      await DriverDocument.create(createPayload);
      setShowAddForm(false);
      setNewDoc({ document_type: '', document_number: '', issue_date: '', expiry_date: '', custom_name: '' });
      if (onDocumentsChange) onDocumentsChange();
    } catch (error) {
      console.error('Add document failed:', error);
    }
  };

  const handleDocFieldChange = (docType, field, value) => {
    setEditDocs(prev => ({
      ...prev,
      [docType]: {
        ...(prev[docType] || { document_type: docType }),
        [field]: value,
      }
    }));
  };

  const sections = [1, 2, 3].map(sectionNum => {
    const types = Object.entries(DOCUMENT_TYPES).filter(([, config]) => {
      if (config.section !== sectionNum) return false;
      if (config.nonEUOnly && !isNonEU) return false;
      return true;
    });
    return { sectionNum, types };
  });

  return (
    <div className="p-4 space-y-4">
      {/* Edit / Save / Cancel buttons */}
      <div className="flex justify-end">
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

      {sections.map(({ sectionNum, types }) => (
        types.length > 0 && (
          <div key={sectionNum}>
            <p className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">
              {SECTIONS[sectionNum]}
            </p>
            <div className="divide-y divide-gray-50">
              {types.map(([docType, config]) =>
                isEditing ? (
                  <DocumentRowEdit
                    key={docType}
                    docType={docType}
                    config={config}
                    editDocs={editDocs}
                    handleDocFieldChange={handleDocFieldChange}
                  />
                ) : (
                  <DocumentRowRead
                    key={docType}
                    docType={docType}
                    config={config}
                    doc={docsMap.get(docType) || null}
                  />
                )
              )}
            </div>
          </div>
        )
      ))}

      {!isEditing && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          {showAddForm ? (
            <div className="space-y-3 bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700">Новый документ</p>
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5">Тип документа</p>
                <Select value={newDoc.document_type} onValueChange={(val) => setNewDoc(prev => ({ ...prev, document_type: val }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Выберите тип..." /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(DOCUMENT_TYPES).map(([key, config]) => {
                      const exists = documents.find(d => d.document_type === key);
                      if (config.nonEUOnly && driver?.nationality_group === 'EU') return null;
                      return (
                        <SelectItem key={key} value={key} disabled={!!exists}>
                          {config.name} ({config.abbr}) {exists ? '— уже есть' : ''}
                        </SelectItem>
                      );
                    })}
                    <SelectItem value="other">Другой</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newDoc.document_type === 'other' && (
                <div>
                  <p className="text-[10px] text-gray-400 mb-0.5">Название документа</p>
                  <Input value={newDoc.custom_name} onChange={(e) => setNewDoc(prev => ({ ...prev, custom_name: e.target.value }))} className="h-8 text-sm" placeholder="Введите название..." />
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[10px] text-gray-400 mb-0.5">Номер</p>
                  <Input value={newDoc.document_number} onChange={(e) => setNewDoc(prev => ({ ...prev, document_number: e.target.value }))} className="h-8 text-sm" placeholder="—" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 mb-0.5">От</p>
                  <DateInput value={newDoc.issue_date} onChange={(val) => setNewDoc(prev => ({ ...prev, issue_date: val }))} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 mb-0.5">До</p>
                  <DateInput value={newDoc.expiry_date} onChange={(val) => setNewDoc(prev => ({ ...prev, expiry_date: val }))} />
                </div>
              </div>
              {newDoc.document_type === 'visa' && (
                <div>
                  <p className="text-[10px] text-gray-400 mb-0.5">Тип визы</p>
                  <Select value={newDoc.visa_type || ''} onValueChange={(val) => setNewDoc(prev => ({ ...prev, visa_type: val }))}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Выберите тип" /></SelectTrigger>
                    <SelectContent>
                      {VISA_TYPES.map(vt => <SelectItem key={vt.value} value={vt.value}>{vt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => { setShowAddForm(false); setNewDoc({ document_type: '', document_number: '', issue_date: '', expiry_date: '', custom_name: '' }); }} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1">Отмена</button>
                <button onClick={handleAddDocument} className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700" disabled={!newDoc.document_type}>Добавить</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAddForm(true)} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
              + Добавить документ
            </button>
          )}
        </div>
      )}
    </div>
  );
}