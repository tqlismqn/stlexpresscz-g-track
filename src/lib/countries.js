export const COUNTRIES = [
  // EU members
  { code: 'AT', name: 'Австрия',              flag: '🇦🇹', eu: true  },
  { code: 'BE', name: 'Бельгия',              flag: '🇧🇪', eu: true  },
  { code: 'BG', name: 'Болгария',             flag: '🇧🇬', eu: true  },
  { code: 'HR', name: 'Хорватия',             flag: '🇭🇷', eu: true  },
  { code: 'CY', name: 'Кипр',                 flag: '🇨🇾', eu: true  },
  { code: 'CZ', name: 'Чехия',                flag: '🇨🇿', eu: true  },
  { code: 'DK', name: 'Дания',                flag: '🇩🇰', eu: true  },
  { code: 'EE', name: 'Эстония',              flag: '🇪🇪', eu: true  },
  { code: 'FI', name: 'Финляндия',            flag: '🇫🇮', eu: true  },
  { code: 'FR', name: 'Франция',              flag: '🇫🇷', eu: true  },
  { code: 'DE', name: 'Германия',             flag: '🇩🇪', eu: true  },
  { code: 'GR', name: 'Греция',               flag: '🇬🇷', eu: true  },
  { code: 'HU', name: 'Венгрия',              flag: '🇭🇺', eu: true  },
  { code: 'IE', name: 'Ирландия',             flag: '🇮🇪', eu: true  },
  { code: 'IT', name: 'Италия',               flag: '🇮🇹', eu: true  },
  { code: 'LV', name: 'Латвия',               flag: '🇱🇻', eu: true  },
  { code: 'LT', name: 'Литва',                flag: '🇱🇹', eu: true  },
  { code: 'LU', name: 'Люксембург',           flag: '🇱🇺', eu: true  },
  { code: 'MT', name: 'Мальта',               flag: '🇲🇹', eu: true  },
  { code: 'NL', name: 'Нидерланды',           flag: '🇳🇱', eu: true  },
  { code: 'PL', name: 'Польша',               flag: '🇵🇱', eu: true  },
  { code: 'PT', name: 'Португалия',           flag: '🇵🇹', eu: true  },
  { code: 'RO', name: 'Румыния',              flag: '🇷🇴', eu: true  },
  { code: 'SK', name: 'Словакия',             flag: '🇸🇰', eu: true  },
  { code: 'SI', name: 'Словения',             flag: '🇸🇮', eu: true  },
  { code: 'ES', name: 'Испания',              flag: '🇪🇸', eu: true  },
  { code: 'SE', name: 'Швеция',               flag: '🇸🇪', eu: true  },
  // EEA
  { code: 'IS', name: 'Исландия',             flag: '🇮🇸', eu: true  },
  { code: 'LI', name: 'Лихтенштейн',         flag: '🇱🇮', eu: true  },
  { code: 'NO', name: 'Норвегия',             flag: '🇳🇴', eu: true  },
  // Non-EU
  { code: 'UA', name: 'Украина',              flag: '🇺🇦', eu: false },
  { code: 'MD', name: 'Молдова',              flag: '🇲🇩', eu: false },
  { code: 'BY', name: 'Беларусь',             flag: '🇧🇾', eu: false },
  { code: 'RU', name: 'Россия',               flag: '🇷🇺', eu: false },
  { code: 'GE', name: 'Грузия',               flag: '🇬🇪', eu: false },
  { code: 'AM', name: 'Армения',              flag: '🇦🇲', eu: false },
  { code: 'AZ', name: 'Азербайджан',          flag: '🇦🇿', eu: false },
  { code: 'UZ', name: 'Узбекистан',           flag: '🇺🇿', eu: false },
  { code: 'KG', name: 'Кыргызстан',           flag: '🇰🇬', eu: false },
  { code: 'TJ', name: 'Таджикистан',          flag: '🇹🇯', eu: false },
  { code: 'TR', name: 'Турция',               flag: '🇹🇷', eu: false },
  { code: 'RS', name: 'Сербия',               flag: '🇷🇸', eu: false },
  { code: 'BA', name: 'Босния и Герцеговина', flag: '🇧🇦', eu: false },
  { code: 'ME', name: 'Черногория',           flag: '🇲🇪', eu: false },
  { code: 'MK', name: 'Северная Македония',   flag: '🇲🇰', eu: false },
  { code: 'AL', name: 'Албания',              flag: '🇦🇱', eu: false },
  { code: 'XK', name: 'Косово',               flag: '🇽🇰', eu: false },
  { code: 'GB', name: 'Великобритания',       flag: '🇬🇧', eu: false },
  { code: 'CH', name: 'Швейцария',            flag: '🇨🇭', eu: false },
];

export const PINNED_COUNTRIES = ['UA', 'MD', 'RO', 'BG', 'CZ', 'SK', 'PL'];

export function getCountryByCode(code) {
  return COUNTRIES.find(c => c.code === code);
}

export function isEUCountry(code) {
  return getCountryByCode(code)?.eu ?? false;
}

export function getSortedCountries() {
  const pinned = PINNED_COUNTRIES.map(code => COUNTRIES.find(c => c.code === code)).filter(Boolean);
  const rest = COUNTRIES.filter(c => !PINNED_COUNTRIES.includes(c.code))
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  return { pinned, rest };
}

// Legacy compatibility
export const countries = COUNTRIES;
export const isEuCountry = isEUCountry;