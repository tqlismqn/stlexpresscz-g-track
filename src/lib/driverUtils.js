export const formatDriverId = (driver) => {
  if (driver?.internal_number) return `DRV-${String(driver.internal_number).padStart(5, '0')}`;
  return driver?.id?.slice(-6) || null;
};