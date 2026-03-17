export const DOCUMENT_TYPES = {
  work_contract: { name: 'Трудовой договор', abbr: 'CON', section: 1, hasNumber: true, hasFrom: true, hasTo: true, indefiniteByDefault: true },
  transport_licence: { name: 'Лицензия', abbr: 'LIC', section: 1, hasNumber: true, hasFrom: true, hasTo: true },
  a1_certificate: { name: 'Сертификат A1', abbr: 'A1', section: 1, hasNumber: true, hasFrom: true, hasTo: true, hasA1CHCheckbox: true },
  declaration: { name: 'Декларация', abbr: 'DEC', section: 1, hasNumber: true, hasFrom: true, hasTo: true },
  insurance: { name: 'Страховка', abbr: 'INS', section: 1, hasNumber: true, hasFrom: true, hasTo: true },
  visa: { name: 'Виза', abbr: 'VISA', section: 1, hasNumber: true, hasFrom: true, hasTo: true, nonEUOnly: true, hasVisaType: true },
  passport: { name: 'Паспорт', abbr: 'PAS', section: 1, hasNumber: true, hasFrom: true, hasTo: true },
  driver_license: { name: 'Водительское удостоверение', abbr: 'DL', section: 2, hasNumber: true, hasFrom: true, hasTo: true },
  adr_certificate: { name: 'ADR', abbr: 'ADR', section: 2, hasNumber: true, hasFrom: true, hasTo: true },
  chip_card: { name: 'Чип (тахокарта)', abbr: 'CHIP', section: 2, hasNumber: true, hasFrom: true, hasTo: true },
  code95: { name: 'Код 95', abbr: 'C95', section: 2, hasNumber: false, hasFrom: true, hasTo: true },
  medical_certificate: { name: 'Медобследование', abbr: 'MED', section: 3, hasNumber: false, hasFrom: true, hasTo: true, autoFillTo: { years: 2 } },
  psihotest: { name: 'Психотест', abbr: 'PSI', section: 3, hasNumber: false, hasFrom: true, hasTo: true },
  travel_insurance: { name: 'Cestovní pojištění', abbr: 'TIN', section: 3, hasNumber: false, hasFrom: true, hasTo: true, nonEUOnly: true },
};

export const SECTIONS = {
  1: 'Основные документы',
  2: 'Водительские документы',
  3: 'Медицинские документы',
};

export const VISA_TYPES = [
  { value: 'vizum', label: 'Vízum' },
  { value: 'povoleni_k_pobytu', label: 'Povolení k pobytu' },
  { value: 'zamestnanecka_karta', label: 'Zaměstnanecká karta' },
  { value: 'modra_karta', label: 'Modrá karta' },
  { value: 'dlouhodoby_pobyt', label: 'Dlouhodobý pobyt' },
];

export const getDocTypeConfig = (type) => DOCUMENT_TYPES[type] || null;

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  } catch { return dateStr; }
};

export const getRemainingDays = (dateStr) => {
  if (!dateStr) return null;
  try {
    const expiry = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  } catch { return null; }
};