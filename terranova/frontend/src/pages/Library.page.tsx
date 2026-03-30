import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../AuthService";
import { PUBLISH_SCOPE } from "../../static/settings";
import { Database, Map, MapPin } from "lucide-react";
import { DatasetLibrary } from "../components/library/DatasetLibrary";
import { NodeTemplateLibrary } from "../components/library/NodeTemplateLibrary";
import { MapLibrary } from "../components/library/MapLibrary";

export function LibraryPageComponent() {
    const { datatype } = useParams();
    const auth = useAuth();

    if (datatype !== "datasets" && datatype !== "maps" && datatype !== "templates") {
        return <Navigate to="/" replace />;
    }

    if (!auth?.user?.scope?.includes(PUBLISH_SCOPE)) {
        return <Navigate to="/login" replace />;
    }

    function renderSubItem() {
        if (datatype === "datasets") {
            return <DatasetLibrary />;
        } else if (datatype === "maps") {
            return <MapLibrary />;
        } else if (datatype === "templates") {
            return <NodeTemplateLibrary />;
        }
    }

    function renderNavbarTitle() {
        if (datatype === "datasets") {
            return (
                <>
                    <Database />
                    Dataset Library
                </>
            );
        } else if (datatype === "maps") {
            return (
                <>
                    <Map />
                    Map Library
                </>
            );
        } else if (datatype === "templates") {
            return (
                <>
                    <MapPin />
                    Node Template Library
                </>
            );
        }
    }

    return (
        <main className="w-full p-4 min-h-full">
            <div className="w-full flex items-center gap-2 mb-4 p-4 bg-light-secondary text-white text-nowrap font-bold">
                {renderNavbarTitle()}
            </div>
            {renderSubItem()}
        </main>
    );
}
