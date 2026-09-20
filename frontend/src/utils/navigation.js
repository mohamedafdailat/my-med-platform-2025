// Return paths stay inside this app and cannot create a login redirect loop.
export const safeReturnPath = (value, fallback = '/dashboard') => {
  const path = typeof value === 'string'
    ? value
    : value && typeof value.pathname === 'string'
      ? `${value.pathname}${value.search || ''}${value.hash || ''}`
      : '';
  if (!path.startsWith('/') || path.startsWith('//') || /[\\\s]/.test(path) ||
      /^\/(login|register|forgot-password)([/?#]|$)/i.test(path)) return fallback;
  return path;
};
