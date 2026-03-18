import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'cs', label: 'Čeština' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);

  const current = currentUser?.language || 'ru';

  const handleSelect = async (code) => {
    setOpen(false);
    i18n.changeLanguage(code);
    await base44.auth.updateMe({ language: code });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded text-gray-300 hover:bg-gray-800 transition-colors text-xs font-medium"
      >
        <Globe className="w-4 h-4" />
        <span>{current.toUpperCase()}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 min-w-[130px] py-1">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between ${
                  current === lang.code
                    ? 'text-white bg-blue-600'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span>{lang.label}</span>
                <span className="text-xs opacity-60 ml-3">{lang.code.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}