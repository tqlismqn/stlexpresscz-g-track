import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import i18n from '../i18n';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'cs', label: 'Čeština' },
];

export default function Settings() {
  const { t } = useTranslation();
  const { currentUser, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState(currentUser?.display_name || currentUser?.full_name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [savingLang, setSavingLang] = useState(false);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await base44.auth.updateMe({ display_name: displayName, phone });
      await refreshUser();
      toast.success(t('toasts.changes_saved'));
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLanguageChange = async (code) => {
    setSavingLang(true);
    try {
      i18n.changeLanguage(code);
      await base44.auth.updateMe({ language: code });
    } catch (e) {
      // silent
    } finally {
      setSavingLang(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('settings.title')}</h1>

        {/* Profile section */}
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{t('settings.profile')}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{t('settings.profile_description')}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">{t('settings.email')}</label>
            <div className="mt-1 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600 border">
              {currentUser?.email || '—'}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">{t('settings.role')}</label>
            <div className="mt-1 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600 border capitalize">
              {currentUser?.role || '—'}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">{t('settings.display_name')}</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('settings.display_name_placeholder')}
              className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">{t('settings.phone')}</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('settings.phone_placeholder')}
              className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? t('settings.saving') : t('settings.save_profile')}
            </button>
          </div>
        </div>

        {/* Language section */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{t('settings.interface_language')}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t('settings.changes_apply_immediately')}</p>
            </div>
            <Select value={i18n.language || 'en'} onValueChange={handleLanguageChange} disabled={savingLang}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>{lang.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}