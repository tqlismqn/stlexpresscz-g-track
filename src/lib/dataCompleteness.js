export const COMPLETENESS_FIELDS = [
  { field: 'country_code',           label: 'Гражданство' },
  { field: 'date_of_birth',          label: 'Дата рождения' },
  { field: 'phone',                  label: 'Телефон' },
  { field: 'passport_number',        label: 'Номер паспорта' },
  { field: 'driving_license_number', label: 'Номер прав' },
];

export function getIncompleteFields(driver) {
  if (!driver) return [];
  const missing = COMPLETENESS_FIELDS.filter(({ field }) => !driver[field]);
  if (!driver.bank_name && !driver.bank_account) {
    missing.push({ field: 'bank', label: 'Банковские реквизиты' });
  }
  return missing;
}