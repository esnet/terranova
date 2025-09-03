import {
    OIDC_REDIRECT_URI,
    OIDC_LOGOUT_REDIRECT_URI,
    OIDC_CLIENT_ID,
    OIDC_AUTHORITY,
} from "../static/settings";
const oidcConfig = {
    authority: OIDC_AUTHORITY,
    client_id: OIDC_CLIENT_ID,
    redirect_uri: OIDC_REDIRECT_URI,
    post_logout_redirect_uri: OIDC_LOGOUT_REDIRECT_URI,
    automaticSilentRenew: true,
};

export default oidcConfig;
