import React, { useContext, useState, useEffect } from "react";
import { LastEdited } from "../context/LastEditedContextProvider";
import { GlobalLastEdited } from "../context/GlobalLastEditedContextProvider";
import { PUBLISH_SCOPE, ADMIN_SCOPE } from "../../static/settings";
import { useAuth } from "../AuthService";
import {
    ChevronLeft,
    Database,
    FileText,
    FolderOpen,
    Map,
    MapPin,
    Menu,
    Settings,
    ToolCase,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PktsIconButton } from "@esnet/packets-ui-react";

export function Sidebar() {
    let auth = useAuth();
    const showSettings = auth?.user?.scope?.includes(PUBLISH_SCOPE);
    const showTemplates = auth?.user?.scope?.includes(ADMIN_SCOPE);

    let lastEdited = useContext(LastEdited);
    let lastGlobal = useContext(GlobalLastEdited);

    let [maps, setMaps] = useState<any[]>([]);
    let [datasets, setDatasets] = useState<any[]>([]);
    let [templates, setTemplates] = useState<any[]>([]);

    // TODO: move this to some persistent state store
    const [open, setOpen] = useState(true);
    const toggleSidebar = () => setOpen((prev) => !prev);
    const closeSidebar = () => setOpen(false);

    useEffect(() => {
        // context is null, skip for now (perhaps render a skeleton)
        if (
            !lastEdited ||
            Object.keys(lastEdited).length === 0 ||
            !lastGlobal ||
            Object.keys(lastGlobal).length === 0
        )
            return;

        type LastUpdatedOn = { lastUpdatedOn: string };
        const sortOnUpdateDate = (a: LastUpdatedOn, b: LastUpdatedOn) =>
            b.lastUpdatedOn.localeCompare(a.lastUpdatedOn);

        // show the 3 last edited items, from either local or global
        // take the total number of locals, and if that's < 3, add in globals until we get 3 (or there are no globals)
        // the end result should have recently edited locals in order, then recently edited globals in order
        const getSortedData = (dataType: "datasets" | "maps" | "templates") => {
            const dataId = {
                maps: "mapId",
                datasets: "datasetId",
                templates: "templateId",
            }[dataType];

            const editedIds = lastEdited[dataType] || [];
            const globals = lastGlobal[dataType] || [];

            const editedItems = globals
                .filter((item: any) => editedIds.includes(item[dataId]))
                .sort(sortOnUpdateDate);

            // if we already have 3 or more, return early
            if (editedItems.length >= 3) {
                return editedItems.slice(0, 3);
            }

            // filter out globals we already have in editedItems, then sort them
            const existingIds = new Set(editedItems.map((item: any) => item[dataId]));
            const remainingGlobals = globals
                .filter((item: any) => !existingIds.has(item[dataId]))
                .sort(sortOnUpdateDate);

            // combine both arrays and slice to max 3 items
            return [...editedItems, ...remainingGlobals].slice(0, 3);
        };

        setMaps(getSortedData("maps"));
        setDatasets(getSortedData("datasets"));
        setTemplates(getSortedData("templates"));
    }, [lastEdited, lastGlobal]);

    return (
        <div
            className={`fixed sm:relative z-1000 h-full flex flex-col gap-2 sm:bg-light-surface_1 sm:shadow-lg ${open ? "bg-light-surface_1 w-full sm:min-w-64 sm:w-auto p-4" : "w-0 p-0 shadow-md"}`}
        >
            <div className={`bottom-3 fixed ${open ? "right-4 sm:left-46" : "left-4"}`}>
                <PktsIconButton
                    onClick={toggleSidebar}
                    variant="secondary"
                    square
                    aria-expanded={open}
                    aria-controls="sidebar"
                    aria-label={open ? "Close Sidebar" : "Open Sidebar"}
                >
                    {open ? <ChevronLeft /> : <Menu />}
                </PktsIconButton>
            </div>
            {open && (
                <nav id="sidebar" className="flex flex-col text-nowrap h-full overflow-hidden">
                    <div className="grow overflow-y-auto min-h-0">
                        <h5 className="flex gap-1 items-center">
                            <ToolCase /> Tools
                        </h5>
                        <ul className="list-none mb-4">
                            <li>
                                <ResponsiveLink closeSidebar={closeSidebar} to="/dataset/new">
                                    Create New Layer
                                </ResponsiveLink>
                            </li>
                            <li>
                                <ResponsiveLink closeSidebar={closeSidebar} to="/map/new">
                                    Create New Map
                                </ResponsiveLink>
                            </li>
                            <li>
                                <ResponsiveLink closeSidebar={closeSidebar} to="/template/new">
                                    Node SVG Builder
                                </ResponsiveLink>
                            </li>
                        </ul>
                        <h5 className="flex gap-1 items-center">
                            <FolderOpen /> Libraries
                        </h5>
                        <ul className="list-none mb-4">
                            <h6>
                                <ResponsiveLink closeSidebar={closeSidebar} to="/library/datasets">
                                    Datasets
                                </ResponsiveLink>
                            </h6>
                            <ul className="pl-0 list-none">
                                {datasets.map((dataset) => (
                                    <li key={dataset.datasetId}>
                                        <ResponsiveLink
                                            closeSidebar={closeSidebar}
                                            to={`/dataset/${dataset.datasetId}`}
                                        >
                                            <Database size={16} />
                                            {dataset.name}
                                        </ResponsiveLink>
                                    </li>
                                ))}
                            </ul>
                            <h6>
                                <ResponsiveLink closeSidebar={closeSidebar} to="/library/maps">
                                    Maps
                                </ResponsiveLink>
                            </h6>
                            <ul className="pl-0 list-none">
                                {maps.map((map) => (
                                    <li key={map.mapId}>
                                        <ResponsiveLink
                                            closeSidebar={closeSidebar}
                                            to={`/map/${map.mapId}`}
                                        >
                                            <Map size={16} />
                                            {map.name}
                                        </ResponsiveLink>
                                    </li>
                                ))}
                            </ul>
                            {showTemplates && (
                                <>
                                    <h6>
                                        <ResponsiveLink
                                            closeSidebar={closeSidebar}
                                            to="/library/templates"
                                        >
                                            Node Templates
                                        </ResponsiveLink>
                                    </h6>
                                    <ul className="pl-0 list-none">
                                        {templates.map((template) => (
                                            <li key={template.templateId}>
                                                <ResponsiveLink
                                                    closeSidebar={closeSidebar}
                                                    to={`/template/${template.templateId}`}
                                                >
                                                    <MapPin size={16} />
                                                    {template.name}
                                                </ResponsiveLink>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </ul>
                        <h5 className="flex gap-1 items-center">
                            <FileText />
                            Resources
                        </h5>
                        <ul className="list-none mb-4">
                            <li className="list-none">
                                <a
                                    href="https://esnet.atlassian.net/wiki/spaces/MAAG/pages/3186196481/Terranova+Documentation"
                                    className="no-underline"
                                >
                                    Documentation
                                </a>
                            </li>
                        </ul>
                    </div>
                    {showSettings && (
                        <div className="shrink-0 pt-4 pb-16 sm:pb-0">
                            <h5 className="w-fit">
                                <ResponsiveLink closeSidebar={closeSidebar} to="/settings">
                                    <Settings />
                                    Settings
                                </ResponsiveLink>
                            </h5>
                        </div>
                    )}
                </nav>
            )}
        </div>
    );
}

// Extended functionality react-dom-router link function that also closes the sidebar on small screen sizes
// This provides a better UX where the full-screened sidebar automatically closes on navigation
interface Link {
    to: string;
    children: React.ReactNode;
    closeSidebar?: () => void;
}
const ResponsiveLink = ({ to, closeSidebar, children }: Link) => {
    return (
        <>
            {/* link to render on sm screen size */}
            <Link
                to={to}
                className="no-underline flex items-center gap-1 sm:hidden"
                onClick={closeSidebar}
            >
                {children}
            </Link>
            {/* link to render when larger than sm screen size */}
            <Link to={to} className="no-underline hidden sm:flex items-center gap-1">
                {children}
            </Link>
        </>
    );
};
