import { Icon } from "../components/Icon.component";
import { BasicAuthUserGrid } from "../components/BasicAuthUserGrid.component";
import { GoogleSheetsSettings } from "../components/GoogleSheetsSettings.component";
import { AUTH_BACKEND } from "../../static/settings";

export function SettingsPageComponent() {
    return (
        <main className="main-content">
            <div className="main-content-header m-2 compound">
                <div className="flex flex-row">
                    <div className="icon sm mr-2">
                        <Icon
                            name="lucide-settings"
                            className="stroke-white -mt-[0.125rem] -ml-[0.125rem]"
                        />
                    </div>
                    Settings
                </div>
            </div>
            <div className=" bg-transparent border-none">
                {AUTH_BACKEND == "basic" ? <BasicAuthUserGrid></BasicAuthUserGrid> : null}
                <GoogleSheetsSettings></GoogleSheetsSettings>
            </div>
        </main>
    );
}
