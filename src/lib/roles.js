const ROLE_ALIASES = {
  administrators: 'admin',
  administrator: 'admin',
  superuser: 'admin',
  admins: 'admin',
  managers: 'manager',
  staff: 'manager',
  salespersons: 'sales',
  salesperson: 'sales',
};

function toArray(input) {
  if (Array.isArray(input)) return input;
  if (typeof input === 'string') return input.split(/[\s,]+/).filter(Boolean);
  return [];
}

export function normalizeRoles(rawRoles = []) {
  const normalized = new Set();
  toArray(rawRoles).forEach((role) => {
    const value = String(role || '').trim().toLowerCase();
    if (!value) return;
    normalized.add(ROLE_ALIASES[value] || value);
  });
  return Array.from(normalized);
}

export function rolesFromTokenPayload(payload = {}) {
  if (!payload || typeof payload !== 'object') return [];
  const collected = [
    ...toArray(payload.roles),
    ...toArray(payload.role),
    ...toArray(payload.groups),
    ...toArray(payload.scopes),
  ];
  if (payload.is_superuser) collected.push('admin');
  if (payload.is_staff) collected.push('manager');
  return normalizeRoles(collected);
}

export function rolesFromProfile(profile = {}) {
  if (!profile || typeof profile !== 'object') return [];
  const collected = [
    ...toArray(profile.roles),
    ...toArray(profile.groups),
  ];
  return normalizeRoles(collected);
}

export function mergeRoles(...roleSets) {
  const merged = new Set();
  roleSets.forEach((roleSet) => {
    normalizeRoles(roleSet).forEach((role) => merged.add(role));
  });
  return Array.from(merged);
}
