export const DOCUMENT_TYPES = {
  work_contract:       { i18nKey: 'doc_types.work_contract',       abbr: 'CON', section: 1, hasNumber: true,  hasFrom: true, hasTo: true, indefiniteByDefault: true },
  transport_licence:   { i18nKey: 'doc_types.transport_licence',   abbr: 'LIC', section: 1, hasNumber: true,  hasFrom: true, hasTo: true },
  a1_certificate:      { i18nKey: 'doc_types.a1_certificate',      abbr: 'A1',  section: 1, hasNumber: true,  hasFrom: true, hasTo: true, hasA1CHCheckbox: true },
  declaration:         { i18nKey: 'doc_types.declaration',         abbr: 'DEC', section: 1, hasNumber: true,  hasFrom: true, hasTo: true },
  insurance:           { i18nKey: 'doc_types.insurance',           abbr: 'INS', section: 1, hasNumber: true,  hasFrom: true, hasTo: true },
  visa:                { i18nKey: 'doc_types.visa',                abbr: 'VIS', section: 1, hasNumber: true,  hasFrom: true, hasTo: true, nonEUOnly: true, hasVisaType: true },
  passport:            { i18nKey: 'doc_types.passport',            abbr: 'PAS', section: 1, hasNumber: true,  hasFrom: true, hasTo: true },
  driver_license:      { i18nKey: 'doc_types.driver_license',      abbr: 'DL',  section: 2, hasNumber: true,  hasFrom: true, hasTo: true },
  adr_certificate:     { i18nKey: 'doc_types.adr_certificate',     abbr: 'ADR', section: 2, hasNumber: true,  hasFrom: true, hasTo: true },
  chip_card:           { i18nKey: 'doc_types.chip_card',           abbr: 'TCH', section: 2, hasNumber: true,  hasFrom: true, hasTo: true },
  code95:              { i18nKey: 'doc_types.code95',              abbr: 'C95', section: 2, hasNumber: false, hasFrom: true, hasTo: true },
  medical_certificate: { i18nKey: 'doc_types.medical_certificate', abbr: 'MED', section: 3, hasNumber: false, hasFrom: true, hasTo: true, autoFillTo: { years: 2 } },
  psihotest:           { i18nKey: 'doc_types.psihotest',           abbr: 'PSI', section: 3, hasNumber: false, hasFrom: true, hasTo: true },
  travel_insurance:    { i18nKey: 'doc_types.travel_insurance',    abbr: 'TIS', section: 3, hasNumber: false, hasFrom: true, hasTo: true, nonEUOnly: true },
};

export const DOCUMENT_TYPE_KEYS = Object.keys(DOCUMENT_TYPES);

export const SECTIONS = {
  1: 'Основные документы',
  2: 'Водительские документы',
  3: 'Медицинские документы',
};

export const VISA_TYPES = [
  { value: 'vizum', label: 'Vízum' },
  { value: 'povoleni_k_pobytu', label: 'Povolení k pobytu' },
  { value: 'docasna_ochrana', label: 'Dočasná ochrana' },
  { value: 'zamestnanecka_karta', label: 'Zaměstnanecká karta' },
  { value: 'modra_karta', label: 'Modrá karta' },
  { value: 'dlouhodoby_pobyt', label: 'Dlouhodobý pobyt' },
  { value: 'trvaly_pobyt', label: 'Trvalý pobyt' },
  { value: 'vizum_strpeni', label: 'Vízum strpění' },
  { value: 'other', label: 'Jiné' },
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