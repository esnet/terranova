// N.B.: This file should be overwritten with a docker mount point. (--mount type=bind,source=/path/to/your/settings.js,target=/terranova/static/settings.js)
export const API_URL = `http://localhost:9999/api/v1/`;
// Authentication Backend. Options are 'basic' and 'oidc'
export const AUTH_BACKEND = `basic`;
// Should we store authentication token in the session? Insecure, but so is basic auth.
export const AUTH_SESSION_STORAGE = true;
// OIDC-specific settings. Unused if AUTH_BACKEND=basic
export const OIDC_REDIRECT_URI = `http://localhost:9999/`;
export const OIDC_LOGOUT_REDIRECT_URI = `http://localhost:9999/login?next=/&message=You+have+been+logged+out.`;
export const OIDC_CLIENT_ID = `terranova-dev`;
export const OIDC_AUTHORITY = `https://auth.example.com/auth/realms/man_esnet`;
// Authorization 'scopes', used by OIDC and Basic Auth
export const READ_WRITE_SCOPE = `terranova:maps:write`;
export const READ_SCOPE = `terranova:maps:read`;
export const PUBLISH_SCOPE = `terranova:maps:publish`;
export const ADMIN_SCOPE = `terranova:admin`;
// Caching timing
export const CACHE_DURATION_IN_SECONDS = 60;
// Map layer limit
export const LAYER_LIMIT = 3;
export const TOOLTIP_TTL = 2;
// should we load the google sheets JWT from ES ('dynamic') or from the filesystem ('static')?
// the default is 'static'. It is much more secure.
export const GOOGLE_SHEETS_CREDENTIAL_SOURCE = `static`;
