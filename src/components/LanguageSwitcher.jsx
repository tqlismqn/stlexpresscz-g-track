import React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { base44 } from '@/api/base44Client';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'cs', name: 'Čeština', flag: '🇨🇿' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const currentLang = i18n.language || 'en';
  const currentFlag = LANGUAGES.find(l => l.code === currentLang)?.flag || '🇬🇧';

  const handleSelect = async (code) => {
    i18n.changeLanguage(code);
    await base44.auth.updateMe({ language: code });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-white/10 transition-colors text-sm">
          <span className="text-base leading-none">{currentFlag}</span>
          <ChevronDown className="h-3 w-3 text-white/60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {LANGUAGES.map(lang => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleSelect(lang.code)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span className="text-base">{lang.flag}</span>
            <span>{lang.name}</span>
            {currentLang === lang.code && <Check className="h-4 w-4 ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}