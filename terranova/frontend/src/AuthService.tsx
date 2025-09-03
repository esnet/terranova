import { AuthProvider, useAuth as useOidcAuth } from "react-oidc-context";
import { AUTH_BACKEND, AUTH_SESSION_STORAGE, API_URL } from "../static/settings.js";
import { setAuthHeaders } from "./DataController";
import * as React from "react";
import oidcConfig from "./OIDCConfig";

const AuthenticationContext = React.createContext(null);

declare global {
    interface Window {
        BasicUser: any;
    }
}

export function useAuth() {
    if (AUTH_BACKEND == "basic") {
        return React.useContext(AuthenticationContext);
    }
    return useOidcAuth();
}

export let checkAuth: any = null;

export async function doBasicAuth(event: any, successCallback: any, failureCallback: any) {
    event.preventDefault();
    let username = event.target.elements.username.value;
    let password = event.target.elements.password.value;
    const hash = btoa(`${username}:${password}`);
    let headers = {
        "Content-Type": "application/json",
        Authorization: `Basic ${hash}`,
    };
    let response = await fetch(`${API_URL}/current_user/`, { headers: headers, method: "GET" });
    if (response.status != 200) {
        failureCallback();
        window.BasicUser = null;
        return false;
    }
    if (response.status == 200) {
        window.BasicUser = hash;
        if (checkAuth) {
            checkAuth();
        }
        successCallback();
    }
}

class AuthState {
    isLoading: boolean = true;
    isAuthenticated: boolean = false;
    user: any = null;

    constructor(obj?: any) {
        this.isLoading = obj?.hasOwnProperty("isLoading") ? obj.isLoading : true;
        this.isAuthenticated = obj?.hasOwnProperty("isAuthenticated") ? obj.isAuthenticated : false;
        this.user = obj?.hasOwnProperty("user") ? obj.user : null;
    }
    signoutRedirect(target: string) {
        window.location.assign(target);
    }
    signinRedirect(target: string) {
        window.location.assign(target);
    }
    removeUser() {
        if (AUTH_SESSION_STORAGE) {
            sessionStorage.setItem("BasicUser", "");
        }
        window.BasicUser = null;
        this.isLoading = false;
        this.isAuthenticated = false;
        this.user = null;
    }
}

export function AuthenticationProvider(props: any) {
    let authState = {} as any;
    if (AUTH_BACKEND == "basic") {
        authState = new AuthState();
    }
    if (AUTH_BACKEND == "oidc") {
        authState = useOidcAuth();
    }

    const [auth, setAuth] = React.useState(authState);

    // this sets 'checkAuth' in the module namespace.
    // (it is assigned to the variable declaration above.)
    // The AuthenticationProvider will be the first thing
    // called in the module, usually (it wraps the rest of the application)
    // and the remainder of the code would be useless without it.
    // why initialize 'checkAuth' here? It needs access to the internal
    // react state.
    checkAuth = () => {
        if (AUTH_BACKEND == "basic") {
            if (AUTH_SESSION_STORAGE) {
                if (window.BasicUser) {
                    sessionStorage.setItem("BasicUser", window.BasicUser);
                }
                window.BasicUser = sessionStorage.getItem("BasicUser");
            }
            if (window.BasicUser) {
                let headers = {
                    "Content-Type": "application/json",
                };
                headers = setAuthHeaders(headers);
                fetch(`${API_URL}/current_user`, { headers: headers, method: "GET" })
                    .then((response) => {
                        return response.json();
                    })
                    .then((user) => {
                        let newAuth = { ...auth } as AuthState;
                        newAuth.isLoading = false;
                        newAuth.isAuthenticated = true;
                        newAuth.user = user;
                        newAuth = new AuthState(newAuth);
                        if (auth?.user !== newAuth?.user) {
                            setAuth(newAuth);
                        }
                    });
            }
        }
    };
    React.useEffect(checkAuth, []);

    return (
        <AuthenticationContext.Provider value={auth}>
            {props.children}
        </AuthenticationContext.Provider>
    );
}
