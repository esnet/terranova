import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth, doBasicAuth } from "../AuthService";
import { SignoutRedirectArgs } from "oidc-client-ts";
import { AUTH_BACKEND, READ_SCOPE } from "../../static/settings";
import { useEffect, useState } from "react";
import { ESButton, ESInputPassword, ESInputRow, ESInputText } from "@esnet/packets-ui";

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
            <div className="flex flex-col grow justify-center min-w-md xl:min-w-2xl px-24 bg-light-primary">
                <h2 className="text-dark-copy">Login</h2>
                {message && (
                    <div className="bg-light-secondary text-white rounded-xl p-1 px-4 mb-4">
                        {message}
                    </div>
                )}
                {AUTH_BACKEND === "oidc" && (
                    <div className="grid h-auto w-full">
                        <ESButton onClick={onOIDCAuth}>Login with Keycloak</ESButton>
                    </div>
                )}
                {AUTH_BACKEND === "basic" && (
                    <form
                        className="[&_span]:text-white flex flex-col gap-y-4"
                        onSubmit={onBasicAuth}
                    >
                        <ESInputRow label="Username">
                            <ESInputText name="username" autoComplete="username" />
                        </ESInputRow>
                        <ESInputRow label="Password">
                            <ESInputPassword name="password" autoComplete="current-password" />
                        </ESInputRow>
                        <ESButton type="submit" as="button" className="mt-4">
                            Login
                        </ESButton>
                    </form>
                )}
            </div>
            <div className="hidden md:block w-full m-8 lg:m-16 bg-terranova-logo-name bg-contain bg-no-repeat bg-center" />
        </div>
    );
}
