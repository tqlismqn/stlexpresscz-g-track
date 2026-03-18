import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import i18n from '../i18n';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'cs', label: 'Čeština' },
];

export default function Settings() {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);

  const handleLanguageChange = async (code) => {
    setSaving(true);
    try {
      i18n.changeLanguage(code);
      await base44.auth.updateMe({ language: code });
    } catch (e) {
      // silent
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('settings.title')}</h1>
        <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
          <div className="flex items-center justify-between px-6 py-5">
            <div>
              <p className="text-sm font-medium text-gray-900">{t('settings.interface_language')}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t('settings.changes_apply_immediately')}</p>
            </div>
            <Select
              value={i18n.language || 'en'}
              onValueChange={handleLanguageChange}
              disabled={saving}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}