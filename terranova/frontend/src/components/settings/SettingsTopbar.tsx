import { Settings } from "lucide-react";

export const SettingsTopbar = () => {
    return (
        <div className="w-full flex gap-2 p-4 items-center bg-light-secondary text-white overflow-hidden">
            <Settings /> <strong>Settings</strong>
        </div>
    );
};
