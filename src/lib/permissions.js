export const PERMISSION_IDS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard_view',
  DASHBOARD_EXPORT: 'dashboard_export',
  // Drivers
  DRIVERS_VIEW: 'drivers_view',
  DRIVER_CREATE: 'driver_create',
  DRIVER_DELETE: 'driver_delete',
  DRIVER_EDIT: 'driver_edit',
  DRIVER_STATUS: 'driver_status',
  DRIVER_EXPORT: 'driver_export',
  DRIVER_TAGS: 'driver_tags',
  // Documents
  DOC_VIEW: 'doc_view',
  DOC_EDIT: 'doc_edit',
  DOC_CREATE: 'doc_create',
  DOC_DELETE: 'doc_delete',
  // Comments
  COMMENT_VIEW: 'comment_view',
  COMMENT_CREATE: 'comment_create',
  COMMENT_EDIT_OWN: 'comment_edit_own',
  COMMENT_DELETE_ANY: 'comment_delete_any',
  // Settings
  SETTINGS_PROFILE: 'settings_profile',
  SETTINGS_COMPANY: 'settings_company',
  SETTINGS_TEAM: 'settings_team',
  SETTINGS_BILLING: 'settings_billing',
  SETTINGS_NOTIFICATIONS: 'settings_notifications',
};

export function hasPermission(permissions, permissionId) {
  if (!permissions || !Array.isArray(permissions)) return false;
  return permissions.includes(permissionId);
}

export function hasAnyPermission(permissions, permissionIds) {
  if (!permissions || !Array.isArray(permissions)) return false;
  return permissionIds.some(id => permissions.includes(id));
}

export function hasAllPermissions(permissions, permissionIds) {
  if (!permissions || !Array.isArray(permissions)) return false;
  return permissionIds.every(id => permissions.includes(id));
}