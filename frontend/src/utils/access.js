// Match the server and Firebase rules: legacy admin claims grant no admin access.
export const hasAdminAccess = (claims) => claims?.role === 'admin' && claims.adminAccessVersion === 1;
