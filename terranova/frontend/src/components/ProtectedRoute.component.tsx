import { useSearchParams } from "react-router-dom";
import { hasAuthParams } from "react-oidc-context";
import { useAuth } from "../AuthService";
import { LoginPageComponent } from "../pages/Login.page";
import { READ_SCOPE, AUTH_BACKEND } from "../../static/settings";

export function Protected(props: { children: any }) {
    // the design of this component is subtle and bears some commentary.
    // It is predicated on the notion that it will be re-rendered
    // on changes in `auth`. As execution continues through the
    // component we hit the first branch, the switch.
    // Here we focus on `auth.activeNavigator`. this is only set
    // when an auth-related navigation is in progress. (debug and confirm)
    // if we pass this switch, we hit the second branch: !auth.isAuthenticated.
    // this is the state rendered when no authentication communication is
    // in-flight and the user is not logged in.
    // finally, we have a third state -- an attempt is not in-flight
    // and the user is logged in, but the url still contains
    // the OIDC parameters that relate to an expired OIDC workflow.
    // we want to trim these off and redirect the user to the desired
    // URL. If these authentication parameters are presented again,
    // the auth flow can get into an odd/expired/indeterminate state.
    // Finally, in the case that we see no active auth-related request,
    // the user is logged in and the URL is free from the OIDC related
    // GET parameters, we will simply render the passed-in children.
    // all of this is driven by React's render cycle, which is present
    // here but not obvious.
    const auth = useAuth();
    // stash the user data in browser memory for reference elsewhere
    /* tslint:disable */
    if (AUTH_BACKEND == "oidc") {
        (window as any).OIDCUser = auth?.user;
    }
    /* tslint:enable */
    switch (auth?.activeNavigator) {
        case "signinRedirect":
        case "signinSilent":
            return <LoginPageComponent message="Logging you in..." />;
        case "signoutRedirect":
            return <LoginPageComponent message="Logging you out..." />;
    }
    if (!auth?.isAuthenticated) {
        // user is not logged in. render the login page.
        return <LoginPageComponent />;
    }
    if (!auth?.user?.scope || auth.user.scope.indexOf(READ_SCOPE) < 0) {
        return <LoginPageComponent message="Insufficient user privileges" />;
    }

    if (hasAuthParams()) {
        const [searchParams, setSearchParams] = useSearchParams();
        const paramsToRemove = ["state", "session_state", "code", "error"];
        paramsToRemove.forEach((remove) => {
            searchParams.delete(remove);
        });
        // local URL without the query string
        let localUrl = window.location.href.split("?")[0];
        // assemble a new query string, less the OIDC params and redirect
        if (searchParams.toString()) {
            localUrl += `?${searchParams.toString()}`;
        }
        (window as any).location = localUrl;
    }

    if (AUTH_BACKEND != "basic" && AUTH_BACKEND != "oidc") {
        return (
            <div>
                Your application is misconfigured. Currently, terranova only supports HTTP Basic
                authentication or OIDC.
            </div>
        );
    }

    return props.children;
}
