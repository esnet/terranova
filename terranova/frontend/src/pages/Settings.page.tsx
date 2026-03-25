import { BasicAuthUserGrid } from "../components/settings/user/BasicAuthUserGrid";
import { AUTH_BACKEND } from "../../static/settings";
import { SettingsTopbar } from "../components/settings/SettingsTopbar";
import { GoogleSheetsSettings } from "../components/settings/googleSheets/GoogleSheets";

export function SettingsPageComponent() {
    return (
        <main className="flex flex-col gap-4 p-4 min-w-0 min-h-full">
            <SettingsTopbar />
            {AUTH_BACKEND == "basic" && <BasicAuthUserGrid />}
            <GoogleSheetsSettings />
        </main>
    );
}
