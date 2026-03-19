import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';

const DriverDocument = base44.entities.DriverDocument;
const DriverHistory = base44.entities.DriverHistory;

export default function DocumentEditModal({ open, onClose, document, documentTypeConfig, driverId, onSaved }) {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form when document changes (no useEffect)
  const initializedDocId = useRef(null);
  const docKey = document?.id || '__new__';
  if (docKey !== initializedDocId.current) {
    initializedDocId.current = docKey;
    setFormData({
      issue_date: document?.issue_date || '',
      expiry_date: document?.expiry_date || '',
      document_number: document?.document_number || '',
      visa_type: document?.visa_type || '',
      a1_switzerland: document?.a1_switzerland || false,
    });
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updateData = {};
      if (documentTypeConfig.hasFrom) updateData.issue_date = formData.issue_date || null;
      if (documentTypeConfig.hasTo) updateData.expiry_date = formData.expiry_date || null;
      if (documentTypeConfig.hasNumber) updateData.document_number = formData.document_number || '';
      if (documentTypeConfig.hasVisaType) updateData.visa_type = formData.visa_type || null;
      if (documentTypeConfig.hasA1CHCheckbox) updateData.a1_switzerland = formData.a1_switzerland || false;

      if (document?.id) {
        await DriverDocument.update(document.id, updateData);
      } else {
        await DriverDocument.create({
          ...updateData,
          driver_id: driverId,
          document_type: documentTypeConfig.type,
        });
      }

      await DriverHistory.create({
        driver_id: driverId,
        action: 'updated',
        field_name: documentTypeConfig.type,
        description: `${documentTypeConfig.i18nKey ? t(documentTypeConfig.i18nKey) : documentTypeConfig.name} ${t('history.field_updated')}`,
        changed_by: currentUser?.display_name || currentUser?.full_name || currentUser?.email?.split('@')[0] || 'Unknown',
      });

      onSaved();
      onClose();
    } catch (error) {
      console.error('Failed to save document:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {documentTypeConfig?.i18nKey ? t(documentTypeConfig.i18nKey) : documentTypeConfig?.name}
            {documentTypeConfig?.abbr && (
              <span className="ml-2 text-sm font-normal text-gray-400">({documentTypeConfig.abbr})</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {documentTypeConfig?.hasNumber && (
            <div>
              <label className="text-sm font-medium text-gray-700">{t('documents.number')}</label>
              <input
                type="text"
                value={formData.document_number || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, document_number: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          )}

          {documentTypeConfig?.hasFrom && (
            <div>
              <label className="text-sm font-medium text-gray-700">{t('documents.issue_date')}</label>
              <input
                type="date"
                value={formData.issue_date || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, issue_date: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          )}

          {documentTypeConfig?.hasTo && (
            <div>
              <label className="text-sm font-medium text-gray-700">{t('documents.expiry_date')}</label>
              <input
                type="date"
                value={formData.expiry_date || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          )}

          {documentTypeConfig?.hasVisaType && (
            <div>
              <label className="text-sm font-medium text-gray-700">{t('documents.visa_type')}</label>
              <select
                value={formData.visa_type || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, visa_type: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">{t('documents.select_visa_type')}</option>
                <option value="povoleni_k_pobytu">{t('visa_types.povoleni_k_pobytu')}</option>
                <option value="vizum">{t('visa_types.vizum')}</option>
                <option value="docasna_ochrana">{t('visa_types.docasna_ochrana')}</option>
                <option value="trvaly_pobyt">{t('visa_types.trvaly_pobyt')}</option>
                <option value="vizum_strpeni">{t('visa_types.vizum_strpeni')}</option>
                <option value="other">{t('visa_types.other')}</option>
              </select>
            </div>
          )}

          {documentTypeConfig?.hasA1CHCheckbox && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="a1_switzerland"
                checked={formData.a1_switzerland || false}
                onChange={(e) => setFormData(prev => ({ ...prev, a1_switzerland: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="a1_switzerland" className="text-sm text-gray-700">🇨🇭 {t('documents.a1_ch_switzerland')}</label>
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? t('common.saving') : t('common.save')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}