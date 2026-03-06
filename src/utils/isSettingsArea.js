const SETTINGS_PREFIX = new Set(["/app/settings"]);
const SETTINGS_EXACT = new Set([
  "/app/settings",
  "/app/users",
  "/app/roles",
  "/app/permissions-matrix",
  "/app/audit-logs",
  "/app/feedback",
]);

export function isSettingsArea(pathname) {
  if (SETTINGS_EXACT.has(pathname)) return true;
  for (const prefix of SETTINGS_PREFIX) {
    if (pathname.startsWith(`${prefix}/`)) return true;
  }
  return false;
}
