import { useContext, useState, useEffect } from "react";
import { LastEdited } from "../context/LastEditedContextProvider";
import { GlobalLastEdited } from "../context/GlobalLastEditedContextProvider";
import { PUBLISH_SCOPE, ADMIN_SCOPE } from "../../static/settings";
import { useAuth } from "../AuthService";
import { ESIconButton } from "@esnet/packets-ui";
import { FileText, FolderOpen, ToolCase } from "lucide-react";

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
    const toggleMenu = () => setOpen((prev) => !prev);

    useEffect(() => {
        // context is null, skip for now (perhaps render a skeleton)
        if (!lastEdited || !lastGlobal) return;

        type LastUpdatedOn = { lastUpdatedOn: string };
        const sortOnUpdateDate = (a: LastUpdatedOn, b: LastUpdatedOn) =>
            b.lastUpdatedOn.localeCompare(a.lastUpdatedOn);

        // show the 3 last edited items, from either local or global
        // take the total number of locals, and if that's < 3, add in globals until we get 3 (or there are no globals)
        // the end result should have recently edited locals in order, then recently edited globals in order
        const getSortedData = (dataType: "datasets" | "maps" | "templates") => {
            // use a map to guarantee unique data objects (id: Data)
            const data = new Map();
            // a way to map data to their ID's (more clear than splicing and appending)
            let idFields = {
                maps: "mapId",
                datasets: "datasetId",
                templates: "templateId",
            };
            // @ts-ignore
            lastEdited[dataType].forEach((item: any) => data.set(item[idFields[dataType]], item));
            const lastEditedSorted = Array.from(data.values()).sort(sortOnUpdateDate);
            // found enough last edited, return as is
            if (lastEditedSorted.length >= 3) {
                return lastEditedSorted.slice(0, 3);
            }

            // not enough local last edited maps, must add in globals
            const extendedData = new Map();
            lastGlobal[dataType]?.forEach((item: any) => {
                // filter out any data that has already been seen in local last edited
                if (data.has(item.id)) return;
                extendedData.set(item[idFields[dataType]], item);
            });
            const globalEditedSorted = Array.from(extendedData.values()).sort(sortOnUpdateDate);
            return lastEditedSorted.concat(globalEditedSorted).slice(0, 3);
        };

        setMaps(getSortedData("maps"));
        setDatasets(getSortedData("datasets"));
        setTemplates(getSortedData("templates"));
    }, [lastEdited, lastGlobal]);

    return (
        <div
            className={`fixed sm:relative h-full p-4 flex flex-col gap-2 sm:bg-light-surface_1
                 ${open ? "bg-light-surface_1 w-full sm:min-w-64 sm:w-auto" : "w-16"}`}
        >
            <div className={"absolute right-3.5 top-3"}>
                <ESIconButton
                    onClick={toggleMenu}
                    variant="tertiary"
                    square
                    name={open ? "chevron-left" : "menu"}
                    aria-expanded={open}
                    aria-controls="sidebar"
                    aria-label={open ? "Close Sidebar" : "Open Sidebar"}
                />
            </div>
            {open && (
                <nav
                    id="sidebar"
                    className="flex flex-col text-nowrap [&_h5,h6,ul,li]:mb-2 [&>ul]:mb-8 [&_h6>a,&>ul>li>a]:no-underline *:list-none"
                >
                    <h5 className="flex gap-1 items-center">
                        <ToolCase /> Tools
                    </h5>
                    <ul>
                        <li>
                            <a href="/dataset/new">Create New Layer</a>
                        </li>
                        <li>
                            <a href="/map/new">Create New Map</a>
                        </li>
                        <li>
                            <a href="/template/new">Node SVG Builder</a>
                        </li>
                    </ul>
                    <h5 className="flex gap-1 items-center">
                        <FolderOpen /> Libraries
                    </h5>
                    <ul>
                        <h6>
                            <a href="/library/datasets">Datasets</a>
                        </h6>
                        <ul>
                            {datasets.map((dataset) => (
                                <li key={dataset.datasetId}>{dataset.name}</li>
                            ))}
                        </ul>
                        <h6>
                            <a href="/library/maps">Maps</a>
                        </h6>
                        <ul>
                            {maps.map((map) => (
                                <li key={map.mapId}>{map.name}</li>
                            ))}
                        </ul>
                        <h6>
                            <a href="/library/templates">Node Templates</a>
                        </h6>
                        <ul>
                            {templates.map((template) => (
                                <li key={template.templateId}>
                                    <a href={`/template/${template.templateId}`}>{template.name}</a>
                                </li>
                            ))}
                        </ul>
                    </ul>
                    <h5 className="flex gap-1 items-center">
                        <FileText />
                        Resources
                    </h5>
                    <ul>
                        <li>
                            <a href="https://esnet.atlassian.net/wiki/spaces/MAAG/pages/3186196481/Terranova+Documentation">
                                Documentation
                            </a>
                        </li>
                        {showSettings && (
                            <li>
                                <a href="/settings">Settings</a>
                            </li>
                        )}
                    </ul>
                </nav>
            )}
        </div>
    );
}
