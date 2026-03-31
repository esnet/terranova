import { useAuth } from "../AuthService";
import { READ_WRITE_SCOPE } from "../../static/settings";
import { PktsAlert } from "@esnet/packets-ui-react";
import { useState } from "react";

export function ReadOnlyWarning() {
    let auth = useAuth();
    const [open, setOpen] = useState(true);

    if (!auth?.user?.scope || auth.user.scope.indexOf(READ_WRITE_SCOPE) < 0) {
        return (
            open && (
                <div className="fixed z-20 inset-x-4 bottom-4">
                    <PktsAlert
                        onClickClose={() => setOpen(false)}
                        variant="warning"
                        title="You are logged in as a read-only user."
                    >
                        &nbsp; You can look around but can't make any changes. Contact your
                        administrator to add permissions for the effective scope "{READ_WRITE_SCOPE}
                        "
                    </PktsAlert>
                </div>
            )
        );
    }
}
