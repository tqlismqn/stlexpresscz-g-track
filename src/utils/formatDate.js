import { format } from 'date-fns';
import { enUS, ru, cs } from 'date-fns/locale';

const localeMap = { en: enUS, ru, cs };

// Maps company date format tokens (moment-style) to date-fns tokens
const normalizeFormat = (fmt) =>
  fmt
    .replace(/DD/g, 'dd')
    .replace(/YYYY/g, 'yyyy')
    .replace(/YY/g, 'yy');

/**
 * Format a date using user language (for locale) and company date format.
 * @param {string|Date} date
 * @param {string} userLanguage - 'en' | 'ru' | 'cs'
 * @param {string} companyDateFormat - e.g. 'DD.MM.YYYY'
 * @returns {string}
 */
export function formatAppDate(date, userLanguage = 'en', companyDateFormat = 'DD.MM.YYYY') {
  if (!date) return '—';
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '—';
  const locale = localeMap[userLanguage] || enUS;
  const formatStr = normalizeFormat(companyDateFormat);
  return format(dateObj, formatStr, { locale });
}