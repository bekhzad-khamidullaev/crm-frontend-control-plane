const normalize = (value, fallback = '') => {
  const str = String(value || '').trim();
  return str || fallback;
};

export function getFrontendVersionInfo() {
  return {
    frontend_version: normalize(import.meta.env.VITE_APP_VERSION, 'dev'),
    git_commit: normalize(import.meta.env.VITE_GIT_COMMIT).slice(0, 12) || null,
    build_timestamp: normalize(import.meta.env.VITE_BUILD_TIMESTAMP) || null,
  };
}
