// N.B.: This file contains dev settings only. It is overwritten in production by ansible.
export const API_URL = `http://localhost:8000`;
export const OIDC_REDIRECT_URI = `http://localhost:5173/`;
export const OIDC_LOGOUT_REDIRECT_URI = `http://localhost:5173/login?next=/&message=You+have+been+logged+out.`;
export const OIDC_CLIENT_ID = `terranova-dev`;
export const OIDC_AUTHORITY = `https://sso-dev.es.net/auth/realms/man_esnet`;
export const LAYER_LIMIT = 3;
export const CACHE_DURATION_IN_SECONDS = 60;
export const TOOLTIP_TTL = 2;
export const READ_WRITE_SCOPE = `terranova:maps:write`;
export const READ_SCOPE = `terranova:maps:read`;
export const PUBLISH_SCOPE = `terranova:maps:publish`;
export const ADMIN_SCOPE = `terranova:admin`;
export const AUTH_BACKEND = `basic`;
export const AUTH_SESSION_STORAGE = true;
export const GOOGLE_SHEETS_CREDENTIAL_SOURCE = `static`;
