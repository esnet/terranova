import { useSearchParams } from "react-router-dom";
import { useAuth, doBasicAuth } from "../AuthService";
import { SignoutRedirectArgs } from "oidc-client-ts";
import { AUTH_BACKEND, AUTH_SESSION_STORAGE, READ_SCOPE } from "../../static/settings";
import { setAuthHeaders } from "../DataController";
import { useState } from "react";

export function LoginPageComponent(props: any) {
    const auth = useAuth();
    const [params, setParams] = useSearchParams();
    const [message, setMessage] = useState(props.message);
    let localUrl = window.location.href;

    function doAuth(event: any) {
        function failureCallback() {
            setMessage("Incorrect Username/Password: Unauthorized");
        }
        function successCallback() {
            setMessage("Authenticated.");
        }
        doBasicAuth(event, successCallback, failureCallback);
    }

    if (props.doLogout) {
        auth?.removeUser();
        auth?.signoutRedirect(
            "/login?message=You+have+been+logged+out&next=/" as SignoutRedirectArgs
        );
    }
    if (params.get("next") || props.next) {
        localUrl = `${window.location.protocol}//${window.location.host}${
            params.get("next") || props.next
        }`;
    }
    if (AUTH_BACKEND == "basic" && auth?.user?.scope && auth.user.scope.indexOf(READ_SCOPE) >= 0) {
        auth?.signinRedirect({ redirect_uri: localUrl });
    }
    return (
        <div className="flex w-full h-full">
            <div
                className="
                    flex
                    w-full
                    md:w-3/5
                    xl:w-2/5
                    px-28
                    md:px-28
                    lg:px-40
                    xl:px-56
                    bg-esnetblue-800
                    mx-auto
                "
            >
                <div className="flex items-center justify-center h-full w-full pb-9">
                    <div className="w-full items-center justify-center my-auto">
                        <div className="grid h-auto w-full">
                            <h2 className="mr-5 text-white">Login</h2>
                        </div>
                        <div className="grid w-full h-auto">
                            {message ? <div className="message-box">{message}</div> : null}
                            {params.get("message") ? (
                                <div className="message-box">{params.get("message")}</div>
                            ) : null}
                        </div>
                        <div className="grid w-full h-auto"></div>
                        {AUTH_BACKEND == "oidc" ? (
                            <div className="grid h-auto w-full">
                                <input
                                    type="button"
                                    className="btn primary w-full"
                                    value="Login with Keycloak"
                                    onClick={() => {
                                        auth?.signinRedirect({ redirect_uri: localUrl });
                                    }}
                                />
                            </div>
                        ) : null}
                        {AUTH_BACKEND == "basic" ? (
                            <div className="grid h-auto w-full">
                                <form onSubmit={doAuth}>
                                    <label htmlFor="username" className="text-white mt-2">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        name="username"
                                        className="w-full"
                                        autoComplete="current-username"
                                    />
                                    <label htmlFor="password" className="text-white mt-2">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        className="w-full mb-8"
                                        autoComplete="current-password"
                                    />
                                    <input
                                        type="submit"
                                        value="Login"
                                        className="btn w-full secondary"
                                    />
                                </form>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
            <div
                className="
                    hidden
                    md:w-3/5
                    xl:2/5
                    py-20
                    px-8
                    bg-tn-layer-3
                    md:grid
                    place-items-center
                    h-screen
                "
            >
                <div className="w-full h-3/4 bg-terranova-logo-name bg-contain bg-no-repeat bg-center"></div>
            </div>
        </div>
    );
}
