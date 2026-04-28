const ACTIVE_BUILDING_KEY = "cs-active-building";

function safeGet(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function safeRemove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

function safeKeys(): string[] {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) keys.push(k);
    }
    return keys;
  } catch {
    return [];
  }
}

export function getActiveBuildingId() {
  return safeGet(ACTIVE_BUILDING_KEY);
}

export function clearBuildingSessions(exceptBuildingId?: string) {
  const keys = safeKeys();
  for (const k of keys) {
    if (!k.startsWith("cs-role-")) continue;
    if (exceptBuildingId && k === `cs-role-${exceptBuildingId}`) continue;
    safeRemove(k);
  }
  if (!exceptBuildingId) safeRemove(ACTIVE_BUILDING_KEY);
}

export function ensureSingleBuildingSession(buildingId: string) {
  const active = getActiveBuildingId();
  if (!active) return;
  if (active === buildingId) return;
  clearBuildingSessions();
}

export function setBuildingSession(buildingId: string, role: string, email?: string) {
  // One active building at a time.
  clearBuildingSessions(buildingId);
  safeSet(ACTIVE_BUILDING_KEY, buildingId);
  safeSet(`cs-role-${buildingId}`, role);
  if (email) safeSet(`cs-email-${buildingId}`, email);
}

export function hasBuildingSession(buildingId: string) {
  const active = getActiveBuildingId();
  const role = safeGet(`cs-role-${buildingId}`);
  return Boolean(active && active === buildingId && role);
}

export function getBuildingRole(buildingId: string) {
  return safeGet(`cs-role-${buildingId}`);
}

export function getBuildingEmail(buildingId: string) {
  return safeGet(`cs-email-${buildingId}`) || "unknown@domain.com";
}

