import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth, doBasicAuth } from "../AuthService";
import { SignoutRedirectArgs } from "oidc-client-ts";
import { AUTH_BACKEND, READ_SCOPE } from "../../static/settings";
import { useEffect, useState } from "react";

/**
 * This component is multi-faceted, serving as the page for both `/login` and `/logout`
 *
 * For `/login`, it serves as an sign in page if not logged in, otherwise simply redirects
 *
 * For `/logout`, it serves as a logout function (so users can be easily logged out by simply navigating to `/logout`), and then redirects to `/login`
 *
 * It may be wise to split them up in the future if the auth logic changes
 */
export function LoginPageComponent(props: any) {
    const auth = useAuth();
    const [params] = useSearchParams();
    const navigate = useNavigate();
    // allow the message to come as either a prop or a param query
    const [message, setMessage] = useState(props.message || params.get("message"));

    const onOIDCAuth = () => {
        auth?.signinRedirect({ redirect_uri: window.location.href });
    };

    const onBasicAuth = (event: any) => {
        doBasicAuth(
            event,
            () => setMessage("Authenticated."),
            () => setMessage("Incorrect Username/Password: Unauthorized"),
        );
    };

    // if prop.doLogout, then redirect back to the login page (this occurs on the /logout page)
    useEffect(() => {
        if (!auth || !props.doLogout) return;
        auth.removeUser();
        // EC: I have concerns over this line (the previous value), while this works as intended for basic auth
        // it doesn't work for OIDC, which requires a different parameter type entirely...
        // https://authts.github.io/oidc-client-ts/classes/UserManager.html#signoutredirect
        auth.signoutRedirect("/login?message=You+have+been+logged+out" as SignoutRedirectArgs);
    }, [auth, props.doLogout]);

    // if the user is logged in and somehow it to this page (/login), redirect them
    // if a specific redirect 'next' link was provided, redirect them there
    useEffect(() => {
        // only perform these actions on basic auth
        if (AUTH_BACKEND != "basic" || !auth?.user?.scope) return;
        const nextUrl = new URL(props.next ?? params.get("next") ?? "/", window.location.href);
        if (auth.user.scope.indexOf(READ_SCOPE) >= 0) {
            navigate(nextUrl.href);
        }
    }, [auth, params, props.next]);

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
                            {message && <div className="message-box">{message}</div>}
                        </div>
                        <div className="grid w-full h-auto"></div>
                        {AUTH_BACKEND == "oidc" && (
                            <div className="grid h-auto w-full">
                                <input
                                    type="button"
                                    className="btn primary w-full"
                                    value="Login with Keycloak"
                                    onClick={onOIDCAuth}
                                />
                            </div>
                        )}
                        {AUTH_BACKEND == "basic" && (
                            <div className="grid h-auto w-full">
                                <form onSubmit={onBasicAuth}>
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
                        )}
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
