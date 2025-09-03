import { useAuth } from "../AuthService";
import { READ_WRITE_SCOPE } from "../../static/settings";
import { Icon } from "../components/Icon.component";

export function ReadOnlyWarning() {
    let auth = useAuth();

    if (auth?.isAuthenticated) {
        if (!auth?.user) return <></>;
        if (!auth?.user?.scope || auth.user.scope.indexOf(READ_WRITE_SCOPE) < 0) {
            return (
                <div className="read-only-warning">
                    <div className="compound justify-start">
                        <Icon name="alert-triangle" className="icon small stroke-mauve-700" />
                        <p className="py-1">
                            <strong className="tn-bold text-mauve-900">
                                You are currently logged in as a read-only user.
                            </strong>
                            &nbsp; You can look around but can't make any changes. Contact your
                            administrator to add permissions for the effective scope "
                            {READ_WRITE_SCOPE}"
                        </p>
                    </div>
                </div>
            );
        }
    }
    return <></>;
}
