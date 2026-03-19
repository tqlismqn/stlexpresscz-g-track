import React, { useState } from 'react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useTranslation } from 'react-i18next';

const DriverDocument = base44.entities.DriverDocument;
import { VISA_TYPES, formatDate, getRemainingDays } from '@/lib/documentTypes';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil, X, RotateCcw } from 'lucide-react';

const STATUS_COLORS = {
  valid: 'bg-green-500',
  expiring: 'bg-yellow-500',
  expired: 'bg-red-500',
  pending_renewal: 'bg-blue-500',
  missing: 'bg-gray-300',
};

function RemainingDays({ expiryDate, t }) {
  if (!expiryDate) return null;
  const days = getRemainingDays(expiryDate);
  if (days === null) return null;
  if (days < 0) return <span className="text-red-600 font-medium">{t('documents.overdue_days', { days: Math.abs(days) })}</span>;
  if (days <= 30) return <span className="text-yellow-600 font-medium">{t('documents.remaining_days', { days })}</span>;
  return <span className="text-gray-500">{t('documents.remaining_days', { days })}</span>;
}

const DateInput = ({ value, onChange, t }) => {
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
      placeholder={t('common.date_placeholder')}
      defaultValue={isoToDisplay(value)}
      onChange={handleChange}
      className="h-7 text-xs"
    />
  );
};

function DocumentRowRead({ docType, config, doc, driver, t }) {
  const status = doc?.status || 'missing';
  const dotColor = STATUS_COLORS[status] || 'bg-gray-300';
  const isIndefinite = config.indefiniteByDefault && !doc?.expiry_date;
  const toDisplay = isIndefinite ? t('documents.indefinite') : formatDate(doc?.expiry_date);
  const hasDateInfo = doc?.issue_date || doc?.expiry_date || isIndefinite;

  return (
    <div className="flex items-start gap-3 py-2">
      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${dotColor}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-medium text-gray-900">{config.name}</span>
          <span className="text-xs text-gray-400">({config.abbr})</span>
          {docType === 'visa' && driver?.visa_type && (
            <span className="text-xs text-muted-foreground ml-1">({t(`visa_types.${driver.visa_type}`)})</span>
          )}
          {docType === 'a1_certificate' && doc?.a1_switzerland && (
            <span className="text-xs text-blue-700 font-medium ml-1">🇨🇭 {t('documents.a1_switzerland')}</span>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          {!doc ? (
            <span className="italic text-gray-400">{t('documents.no_data')}</span>
          ) : (
            <>
              {doc.document_number && <span>{doc.document_number} · </span>}
              {hasDateInfo ? (
                <span>{formatDate(doc?.issue_date)} → {toDisplay}</span>
              ) : (
                <span className="italic text-gray-400">{t('documents.no_data')}</span>
              )}
            </>
          )}
        </div>
      </div>
      <div className="text-xs text-right flex-shrink-0">
        {doc?.expiry_date && !isIndefinite && <RemainingDays expiryDate={doc.expiry_date} t={t} />}
      </div>
    </div>
  );
}

const LICENCE_TYPES = ['transport_licence', 'licence'];

// Normalize licence types to a single key for grouping
const normalizeDocType = (docType) => LICENCE_TYPES.includes(docType) ? 'transport_licence' : docType;

function PreviousDocumentRow({ doc, docTypeName, onMarkAsReturned, t }) {
  const isPending = doc.return_status === 'pending_return';
  const isReturned = doc.return_status === 'returned';

  return (
    <div className={`ml-4 pl-3 border-l-2 py-1.5 ${isPending ? 'border-orange-400' : 'border-gray-200'} ${isReturned ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-gray-500 italic">{t('documents.previous_document')} {docTypeName}</span>
            {isPending && (
              <span className="text-xs text-orange-600 font-medium">⏳ {t('documents.pending_return')}</span>
            )}
            {isReturned && (
              <span className="text-xs text-green-600 font-medium">✓ {t('documents.returned')}</span>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {doc.document_number && <span>{doc.document_number} · </span>}
            {(doc.issue_date || doc.expiry_date) && (
              <span>{formatDate(doc.issue_date)} → {formatDate(doc.expiry_date)}</span>
            )}
          </div>
        </div>
        {isPending && (
          <button
            onClick={() => onMarkAsReturned(doc)}
            className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-800 border border-orange-300 rounded px-2 py-0.5 whitespace-nowrap flex-shrink-0"
          >
            <RotateCcw className="w-3 h-3" /> {t('documents.mark_as_returned')}
          </button>
        )}
      </div>
    </div>
  );
}

function DocumentRowEdit({ docType, config, editDocs, handleDocFieldChange, onDelete, onRenewDocument, t }) {
  const existingDoc = editDocs[docType];
  const showRenewButton = existingDoc?.expiry_date && existingDoc?.return_status !== 'pending_return';
  return (
    <div className="py-2">
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="text-sm font-medium text-gray-900">{config.name}</span>
        <span className="text-xs text-gray-400">({config.abbr})</span>
        {existingDoc?.id && (
          <button
            onClick={() => onDelete(existingDoc.id, docType)}
            className="text-gray-300 hover:text-red-500 transition-colors ml-auto"
            title={t('documents.delete_document')}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {config.hasNumber && (
          <div>
            <p className="text-[10px] text-gray-400 mb-0.5">{t('fields.number')}</p>
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
            <p className="text-[10px] text-gray-400 mb-0.5">{t('fields.from')}</p>
            <DateInput
              value={editDocs[docType]?.issue_date || ''}
              onChange={(val) => handleDocFieldChange(docType, 'issue_date', val)}
              t={t}
            />
          </div>
        )}
        {config.hasTo && (
          <div>
            <p className="text-[10px] text-gray-400 mb-0.5">{t('fields.to')}</p>
            <DateInput
              value={editDocs[docType]?.expiry_date || ''}
              onChange={(val) => handleDocFieldChange(docType, 'expiry_date', val)}
              t={t}
            />
          </div>
        )}
      </div>
      {config.hasVisaType && (
        <div className="mt-1.5">
          <p className="text-[10px] text-gray-400 mb-0.5">{t('documents.visa_type')}</p>
          <Select
            value={editDocs[docType]?.visa_type || ''}
            onValueChange={(val) => handleDocFieldChange(docType, 'visa_type', val)}
          >
            <SelectTrigger className="h-7 text-xs"><SelectValue placeholder={t('documents.select_type')} /></SelectTrigger>
            <SelectContent>
              {VISA_TYPES.map(vt => <SelectItem key={vt.value} value={vt.value}>{vt.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      {showRenewButton && (
        <div className="mt-1.5">
          <button
            type="button"
            onClick={() => onRenewDocument(existingDoc)}
            className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-800 border border-orange-300 rounded px-2 py-1"
          >
            🔄 {t('documents.renew')}
          </button>
        </div>
      )}
      {config.hasA1CHCheckbox && (
        <div className="flex items-center gap-2 mt-1.5">
          <Checkbox
            checked={editDocs[docType]?.a1_ch || false}
            onCheckedChange={(val) => handleDocFieldChange(docType, 'a1_ch', val)}
          />
          <span className="text-xs text-gray-600">{t('documents.a1_ch_switzerland')}</span>
        </div>
      )}
    </div>
  );
}

export default function DriverDocumentsTabContent({ driver, documents = [], onDocumentsChange, onEditingChange }) {
  const { t } = useTranslation();

  const SECTIONS = {
    1: t('documents.sections.main'),
    2: t('documents.sections.driving'),
    3: t('documents.sections.medical'),
    4: t('documents.sections.specific'),
  };

  const DOCUMENT_TYPES = {
    work_contract:       { name: t('doc_types.work_contract'),        abbr: 'CON', section: 1, hasNumber: true,  hasFrom: true, hasTo: true, indefiniteByDefault: true },
    transport_licence:   { name: t('doc_types.transport_licence'),    abbr: 'LIC', section: 1, hasNumber: true,  hasFrom: true, hasTo: true },
    a1_certificate:      { name: t('doc_types.a1_certificate'),       abbr: 'A1',  section: 1, hasNumber: true,  hasFrom: true, hasTo: true, hasA1CHCheckbox: true },
    declaration:         { name: t('doc_types.declaration'),          abbr: 'DEC', section: 1, hasNumber: true,  hasFrom: true, hasTo: true },
    insurance:           { name: t('doc_types.insurance'),            abbr: 'INS', section: 1, hasNumber: true,  hasFrom: true, hasTo: true },
    visa:                { name: t('doc_types.visa'),                 abbr: 'VIS', section: 1, hasNumber: true,  hasFrom: true, hasTo: true, nonEUOnly: true, hasVisaType: true },
    passport:            { name: t('doc_types.passport'),             abbr: 'PAS', section: 1, hasNumber: true,  hasFrom: true, hasTo: true },
    driver_license:      { name: t('doc_types.driver_license'),       abbr: 'DL',  section: 2, hasNumber: true,  hasFrom: true, hasTo: true },
    adr_certificate:     { name: t('doc_types.adr_certificate'),      abbr: 'ADR', section: 2, hasNumber: true,  hasFrom: true, hasTo: true },
    chip_card:           { name: t('doc_types.chip_card'),            abbr: 'TCH', section: 2, hasNumber: true,  hasFrom: true, hasTo: true },
    code95:              { name: t('doc_types.code95'),               abbr: 'C95', section: 2, hasNumber: false, hasFrom: true, hasTo: true },
    medical_certificate: { name: t('doc_types.medical_certificate'),  abbr: 'MED', section: 3, hasNumber: false, hasFrom: true, hasTo: true, autoFillTo: { years: 2 } },
    psihotest:           { name: t('doc_types.psihotest'),            abbr: 'PSI', section: 3, hasNumber: false, hasFrom: true, hasTo: true },
    travel_insurance:    { name: t('doc_types.travel_insurance'),     abbr: 'TIS', section: 3, hasNumber: false, hasFrom: true, hasTo: true, nonEUOnly: true },
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editDocs, setEditDocs] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDoc, setNewDoc] = useState({ document_type: '', document_number: '', issue_date: '', expiry_date: '', custom_name: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const isNonEU = driver?.nationality_group === 'non-EU';

  // Group all documents by normalized type, sorted by expiry_date desc (fallback: created_date)
  const groupedDocs = new Map();
  documents.forEach(doc => {
    const key = normalizeDocType(doc.document_type);
    if (!groupedDocs.has(key)) groupedDocs.set(key, []);
    groupedDocs.get(key).push(doc);
  });
  groupedDocs.forEach((docs, key) => {
    docs.sort((a, b) => {
      const aDate = a.expiry_date || a.issue_date || a.created_date || '';
      const bDate = b.expiry_date || b.issue_date || b.created_date || '';
      return bDate > aDate ? 1 : -1;
    });
  });

  // For view mode: currentDoc = [0], previousDoc = [1] only if pending_return
  const docsMap = new Map();
  const previousDocMap = new Map(); // docType -> previousDoc (if pending_return)
  groupedDocs.forEach((docs, key) => {
    if (docs[0]) docsMap.set(key, docs[0]);
    if (docs[1] && docs[1].return_status === 'pending_return') previousDocMap.set(key, docs[1]);
  });

  const handleRenewDocument = async (oldDoc) => {
    try {
      await DriverDocument.update(oldDoc.id, { return_status: 'pending_return' });
      await DriverDocument.create({
        driver_id: driver.id,
        document_type: oldDoc.document_type,
        issue_date: null,
        expiry_date: null,
        document_number: null,
        status: 'missing',
        return_status: null,
      });
      await base44.entities.DriverHistory.create({
        driver_id: driver.id,
        action: 'updated',
        field_name: oldDoc.document_type,
        old_value: oldDoc.expiry_date || '',
        new_value: '',
        description: t('documents.document_renewed'),
        changed_by: 'Admin',
      });
      toast.success(t('documents.document_renewed'));
      if (onDocumentsChange) onDocumentsChange();
    } catch (err) {
      console.error(err);
      toast.error(t('toasts.documents_save_error'));
    }
  };

  const handleMarkAsReturned = async (doc) => {
    await DriverDocument.update(doc.id, { return_status: 'returned' });
    await base44.entities.DriverHistory.create({
      driver_id: driver.id,
      action: 'updated',
      field_name: 'return_status',
      old_value: 'pending_return',
      new_value: 'returned',
      description: t('documents.returned'),
      changed_by: 'Admin',
    });
    if (onDocumentsChange) onDocumentsChange();
  };

  const startEditing = () => {
    const map = {};
    // Only edit the CURRENT (newest) doc per type
    docsMap.forEach((doc, key) => {
      map[key] = {
        id: doc.id,
        document_type: doc.document_type,
        document_number: doc.document_number || '',
        issue_date: doc.issue_date || '',
        expiry_date: doc.expiry_date || '',
        visa_type: doc.visa_type || '',
        status: doc.status || '',
        return_status: doc.return_status || '',
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
    setIsSaving(true);
    try {
      for (const [docType, docData] of Object.entries(editDocs)) {
        const existingDoc = documents.find(d => d.document_type === docType);
        if (existingDoc) {
          const updatePayload = {
            document_number: docData.document_number || '',
            issue_date: docData.issue_date || null,
            expiry_date: docData.expiry_date || null,
          };
          if (docData.visa_type) updatePayload.visa_type = docData.visa_type;
          await DriverDocument.update(existingDoc.id, updatePayload);
        } else {
          const hasData = docData.document_number || docData.issue_date || docData.expiry_date;
          if (hasData) {
            const createPayload = {
              driver_id: driver.id,
              document_type: docType,
              document_number: docData.document_number || '',
              issue_date: docData.issue_date || null,
              expiry_date: docData.expiry_date || null,
              status: 'valid',
            };
            await DriverDocument.create(createPayload);
          }
        }
      }
      setIsEditing(false);
      if (onEditingChange) onEditingChange(false);
      if (onDocumentsChange) onDocumentsChange();
      toast.success(t('toasts.documents_saved'));
    } catch (error) {
      console.error('Document save failed:', error);
      toast.error(t('toasts.documents_save_error'));
    } finally {
      setIsSaving(false);
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
      toast.success(t('toasts.document_added'));
    } catch (error) {
      console.error('Add document failed:', error);
      toast.error(t('toasts.document_add_error'));
    }
  };

  const handleDeleteDocument = (docId, docType) => {
    if (!docId) return;
    setDeleteConfirm({ docId, docType });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await DriverDocument.delete(deleteConfirm.docId);
      setDeleteConfirm(null);
      if (onDocumentsChange) onDocumentsChange();
      toast.success(t('toasts.document_deleted'));
    } catch (error) {
      console.error('Delete document failed:', error);
      toast.error(t('toasts.document_delete_error'));
    }
  };

  const handleDocFieldChange = (docType, field, value) => {
    setEditDocs(prev => {
      const updated = {
        ...prev,
        [docType]: {
          ...(prev[docType] || { document_type: docType }),
          [field]: value,
        }
      };
      if (field === 'issue_date' && value) {
        const docConfig = DOCUMENT_TYPES[docType];
        if (docConfig?.autoFillTo?.years) {
          const autoExpiry = new Date(value);
          autoExpiry.setFullYear(autoExpiry.getFullYear() + docConfig.autoFillTo.years);
          const yyyy = autoExpiry.getFullYear();
          const mm = String(autoExpiry.getMonth() + 1).padStart(2, '0');
          const dd = String(autoExpiry.getDate()).padStart(2, '0');
          updated[docType].expiry_date = `${yyyy}-${mm}-${dd}`;
        }
      }
      return updated;
    });
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
            <button onClick={cancelEditing} disabled={isSaving} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 disabled:opacity-50">{t('common.cancel')}</button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="text-sm bg-green-600 text-white px-4 py-1.5 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  {t('common.saving')}
                </>
              ) : t('common.save')}
            </button>
          </div>
        ) : (
          <button onClick={startEditing} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
            <Pencil className="w-3.5 h-3.5" /> {t('common.edit')}
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
              {types.map(([docType, config]) => {
                const normalizedType = normalizeDocType(docType);
                return isEditing ? (
                <DocumentRowEdit
                 key={docType}
                 docType={normalizedType}
                 config={config}
                 editDocs={editDocs}
                 handleDocFieldChange={handleDocFieldChange}
                 onDelete={handleDeleteDocument}
                 onRenewDocument={handleRenewDocument}
                 t={t}
                />
                ) : (
                <div key={docType}>
                  <DocumentRowRead
                    docType={docType}
                    config={config}
                    doc={docsMap.get(normalizedType) || null}
                    driver={driver}
                    t={t}
                  />
                  {previousDocMap.has(normalizedType) && (
                    <PreviousDocumentRow
                      doc={previousDocMap.get(normalizedType)}
                      docTypeName={config.name}
                      onMarkAsReturned={handleMarkAsReturned}
                      t={t}
                    />
                  )}
                </div>
                );
              })}
            </div>
          </div>
        )
      ))}

      {!isEditing && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          {showAddForm ? (
            <div className="space-y-3 bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700">{t('documents.new_document')}</p>
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5">{t('documents.visa_type')}</p>
                <Select value={newDoc.document_type} onValueChange={(val) => setNewDoc(prev => ({ ...prev, document_type: val }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder={t('documents.select_type')} /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(DOCUMENT_TYPES).map(([key, config]) => {
                      const exists = documents.find(d => d.document_type === key);
                      if (config.nonEUOnly && driver?.nationality_group === 'EU') return null;
                      return (
                        <SelectItem key={key} value={key} disabled={!!exists}>
                          {t(`doc_types.${key}`, { defaultValue: config.name })} ({config.abbr}) {exists ? t('documents.already_exists') : ''}
                        </SelectItem>
                      );
                    })}
                    <SelectItem value="other">{t('documents.other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newDoc.document_type === 'other' && (
                <div>
                  <p className="text-[10px] text-gray-400 mb-0.5">{t('documents.document_name')}</p>
                  <Input value={newDoc.custom_name} onChange={(e) => setNewDoc(prev => ({ ...prev, custom_name: e.target.value }))} className="h-8 text-sm" placeholder={t('documents.enter_name')} />
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[10px] text-gray-400 mb-0.5">{t('fields.number')}</p>
                  <Input value={newDoc.document_number} onChange={(e) => setNewDoc(prev => ({ ...prev, document_number: e.target.value }))} className="h-8 text-sm" placeholder="—" />
                </div>
                <div>
                   <p className="text-[10px] text-gray-400 mb-0.5">{t('fields.from')}</p>
                   <DateInput value={newDoc.issue_date} t={t} onChange={(val) => {
                     const docConfig = DOCUMENT_TYPES[newDoc.document_type];
                     if (docConfig?.autoFillTo?.years && val) {
                       const autoExpiry = new Date(val);
                       autoExpiry.setFullYear(autoExpiry.getFullYear() + docConfig.autoFillTo.years);
                       const yyyy = autoExpiry.getFullYear();
                       const mm = String(autoExpiry.getMonth() + 1).padStart(2, '0');
                       const dd = String(autoExpiry.getDate()).padStart(2, '0');
                       setNewDoc(prev => ({ ...prev, issue_date: val, expiry_date: `${yyyy}-${mm}-${dd}` }));
                     } else {
                       setNewDoc(prev => ({ ...prev, issue_date: val }));
                     }
                   }} />
                 </div>
                <div>
                  <p className="text-[10px] text-gray-400 mb-0.5">{t('fields.to')}</p>
                  <DateInput value={newDoc.expiry_date} t={t} onChange={(val) => setNewDoc(prev => ({ ...prev, expiry_date: val }))} />
                </div>
              </div>
              {newDoc.document_type === 'visa' && (
                <div>
                  <p className="text-[10px] text-gray-400 mb-0.5">{t('documents.visa_type')}</p>
                  <Select value={newDoc.visa_type || ''} onValueChange={(val) => setNewDoc(prev => ({ ...prev, visa_type: val }))}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder={t('documents.select_type')} /></SelectTrigger>
                    <SelectContent>
                      {VISA_TYPES.map(vt => <SelectItem key={vt.value} value={vt.value}>{vt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => { setShowAddForm(false); setNewDoc({ document_type: '', document_number: '', issue_date: '', expiry_date: '', custom_name: '' }); }} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1">{t('common.cancel')}</button>
                 <button onClick={handleAddDocument} className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700" disabled={!newDoc.document_type}>{t('common.add')}</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAddForm(true)} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
              {t('documents.add_document')}
            </button>
          )}
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('dialogs.delete_document_title')}</h3>
            <p className="text-sm text-gray-600 mb-4">
              {t('dialogs.delete_document_message', { name: t(`doc_types.${deleteConfirm.docType}`, { defaultValue: DOCUMENT_TYPES[deleteConfirm.docType]?.name || deleteConfirm.docType }) })}
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5">{t('common.cancel')}</button>
              <button onClick={confirmDelete} className="text-sm bg-red-600 text-white px-4 py-1.5 rounded-md hover:bg-red-700">{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}