import { useContext, useState, useEffect } from "react";
import { DataController } from "../DataController";
import { LastEdited } from "../context/LastEditedContextProvider";
import { GlobalLastEdited } from "../context/GlobalLastEditedContextProvider";
import { SIDEBAR_STRUCTURE, SIDEBAR_STRUCTURE_TEMPLATES_ITEM } from "../data/constants";
import { DataControllerType } from "../types/mapeditor";
import { API_URL, PUBLISH_SCOPE, ADMIN_SCOPE } from "../../static/settings";
import { setAuthHeaders } from "../DataController";
import { useAuth } from "../AuthService";
import { ESIconButton } from "@esnet/packets-ui";
import { _Map as Map, Dataset, Template } from "../../../client/typescript";
import { FileText, FolderOpen, ToolCase } from "lucide-react";

//////// TO BE PORTED TO PACKETS SYSTEM
type ESNestedListProps = {
    /** List header, recommended but not necessary to have. */
    header?: React.ReactNode;
    /** ESNestedListItem or ESNestedList (for further nesting) children. */
    children: React.ReactNode;
};
function ESNestedList({ header, children }: ESNestedListProps) {
    return (
        <div className="flex flex-col gap-2">
            {header && <div>{header}</div>}
            <ul className="pl-4">{children}</ul>
        </div>
    );
}
type ESNestedListItemProps = {
    /** Nested list item content, typically text, wrapped in a `<li>` tag. */
    children: React.ReactNode;
    /** Whether to show a bullet point. */
    noDisc?: boolean;
};
function ESNestedListItem({ children, noDisc = false }: ESNestedListItemProps) {
    return <li className={`${noDisc && "list-none"} mt-0 mb-2`}>{children}</li>;
}
//////// END PACKETS PORT

type SidebarMenuListProps = {
    header: string;
    icon?: React.ReactElement;
    children: React.ReactNode;
};
// Custom wrapper around ESNestedList to apply specific header styling and icon content
function SidebarMenuList({ header, icon, children }: SidebarMenuListProps) {
    return (
        <ESNestedList
            header={
                <h5 className="flex items-center pb-0 gap-2 my-0 w-full">
                    {icon}
                    {header}
                </h5>
            }
        >
            {children}
        </ESNestedList>
    );
}

export function Sidebar() {
    let auth = useAuth();

    const [showTemplates, setShowTemplates] = useState<boolean>(false);
    const [showSettings, setShowSettings] = useState<boolean>(false);

    useEffect(() => {
        if (!auth?.user?.scope) return;

        // I don't understand the structure of the scope string, but I can't help but feel that doing a .in() is better
        setShowSettings(auth.user.scope.indexOf(PUBLISH_SCOPE) > 0);
        setShowTemplates(auth.user.scope.indexOf(ADMIN_SCOPE) > 0);
    }, [auth?.user?.scope]);

    let [navigationItems, setNavigationItems] = useState(
        JSON.parse(JSON.stringify(SIDEBAR_STRUCTURE))
    );

    let lastEdited = useContext(LastEdited);
    let lastGlobal = useContext(GlobalLastEdited);

    let [maps, setMaps] = useState<Map[]>([]);
    let [datasets, setDatasets] = useState<Dataset[]>([]);
    let [templates, setTemplates] = useState<Template[]>([]);

    const [controller] = useState<DataControllerType>(
        new DataController(null, navigationItems, setNavigationItems)
    ) as any;

    // move to util file or outside of function
    const sortDatesDesc = (a: any, b: any) => {
        if (a.lastUpdatedOn > b.lastUpdatedOn) {
            return -1;
        }
        if (a.lastUpdatedOn == b.lastUpdatedOn) {
            return 0;
        }
        if (a.lastUpdatedOn < b.lastUpdatedOn) {
            return 1;
        }
    };

    // construct a list of components for a specific itemType (dataset, sidebar, templates)
    const buildSidebar = (items: any[], itemType: string, itemId: string, icon: string) => {
        let result = [];
        if (items.length !== 0) {
            for (let item of items) {
                let data = {
                    id: item[itemId],
                    text: item.name,
                    href: `/${itemType}/${item[itemId]}`,
                    className: "sub-group",
                    collapsible: false,
                    current: false,
                    icon: icon,
                };
                result.push(data);
            }
        }
        return result;
    };

    const fetchDetails = async (dataType: string, idType: string) => {
        // getString will be a string like
        // mapId=a&mapId=b&mapId=c
        // @ts-ignore
        let getString = lastEdited?.[dataType]?.map((id: any) => `${idType}=${id}`).join("&");

        let apiUrl = `${API_URL}/${dataType}/?${getString}`;
        let headers = {
            "Content-Type": "application/json",
        } as any;
        headers = setAuthHeaders(headers);
        let response = await fetch(apiUrl, { headers: headers, method: "GET" });
        console.log("fetched details...", response);
        if (response.ok) {
            let output = await response.json();
            // @ts-ignore
            let order = lastEdited?.[dataType];
            output.sort(function (a: any, b: any) {
                var A = a["mapId"],
                    B = b["mapId"];
                if (order.indexOf(A) < order.indexOf(B)) {
                    return 1;
                } else {
                    return -1;
                }
            });
            if (dataType === "maps") {
                maps = output;
                setMaps([...maps]);
            } else if (dataType === "datasets") {
                datasets = output;
                setDatasets([...datasets]);
            } else if (dataType === "templates") {
                templates = output;
                setTemplates([...templates]);
            }
        }
    };

    useEffect(() => {
        if (lastEdited?.maps?.length > 0) {
            fetchDetails("maps", "mapId");
        }

        if (maps.length < 3 && lastGlobal?.maps) {
            let remainingItems = 3 - maps.length;
            // Only include those from lastGlobal which are not present in templates
            let remainingMaps = lastGlobal.maps
                ?.sort(sortDatesDesc)
                .slice(0, remainingItems)
                .filter((obj2: any) => !maps.some((obj1) => obj1["mapId"] === obj2["mapId"]));
            maps = maps.concat(remainingMaps);
            setMaps(maps);
        }

        if (lastEdited?.datasets?.length > 0) {
            fetchDetails("datasets", "datasetId");
        }

        if (datasets.length < 3 && lastGlobal?.datasets) {
            let remainingItems = 3 - datasets.length;
            // Only include those from lastGlobal which are not present in templates
            let remainingDatasets = lastGlobal.datasets
                ?.sort(sortDatesDesc)
                .slice(0, remainingItems)
                .filter(
                    (obj2: any) => !datasets.some((obj1) => obj1["datasetId"] === obj2["datasetId"])
                );
            datasets = datasets.concat(remainingDatasets);
            setDatasets(datasets);
        }

        if (lastEdited?.templates?.length > 0) {
            fetchDetails("templates", "templateId");
        }

        if (templates.length < 3 && lastGlobal?.templates) {
            let remainingItems = 3 - templates.length;
            // Only include those from lastGlobal which are not present in templates
            let remainingTemplates = lastGlobal.templates
                ?.sort(sortDatesDesc)
                .slice(0, remainingItems)
                .filter(
                    (obj2: any) =>
                        !templates.some((obj1) => obj1["templateId"] === obj2["templateId"])
                );
            templates = templates.concat(remainingTemplates);
            setTemplates(templates);
        }
        console.log("hello", lastGlobal);

        // Build navigation items
        let datasetSubItems = buildSidebar(datasets, "dataset", "datasetId", "lucide-database");
        let mapSubItems = buildSidebar(maps, "map", "mapId", "lucide-map");

        navigationItems.subItems[1].subItems[0].subItems = datasetSubItems;
        navigationItems.subItems[1].subItems[1].subItems = mapSubItems;

        if (showTemplates) {
            let templateSubItems = buildSidebar(
                templates,
                "template",
                "templateId",
                "lucide-map-pin"
            );
            if (navigationItems.subItems[1].subItems.length <= 2) {
                navigationItems.subItems[1].subItems.push(SIDEBAR_STRUCTURE_TEMPLATES_ITEM);
            }
            navigationItems.subItems[1].subItems[2].subItems = templateSubItems;
        }

        // Update navigation items
        controller.setInstance({ ...navigationItems });
    }, [
        lastEdited?.maps,
        lastEdited?.datasets,
        lastEdited?.templates,
        lastGlobal?.maps,
        lastGlobal?.datasets,
        lastGlobal?.templates,
    ]);

    // TODO: move this to some persistent state store
    const [open, setOpen] = useState(true);
    const toggleMenu = () => setOpen((prev) => !prev);

    return (
        <div
            className={`fixed sm:relative ${
                open ? "bg-light-surface_1 w-full sm:min-w-64 sm:w-auto" : "w-16"
            } h-full p-4 flex flex-col gap-2 sm:bg-light-surface_1`}
        >
            <div className={"absolute right-3 top-3"}>
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
                <nav id="sidebar" className={`overflow-hidden text-nowrap`}>
                    <SidebarMenuList header="Tools" icon={<ToolCase />}>
                        <ESNestedListItem noDisc>
                            <a href="/dataset/new">Create New Layer</a>
                        </ESNestedListItem>
                        <ESNestedListItem noDisc>
                            <a href="/map/new">Create New Map</a>
                        </ESNestedListItem>
                        <ESNestedListItem noDisc>
                            <a href="/template/new">Node SVG Builder</a>
                        </ESNestedListItem>
                    </SidebarMenuList>
                    <SidebarMenuList header="Libraries" icon={<FolderOpen />}>
                        <ESNestedList header={<a href="/library/datasets">Datasets</a>}>
                            {datasets.map((dataset) => (
                                <ESNestedListItem>{dataset.name}</ESNestedListItem>
                            ))}
                        </ESNestedList>
                        <ESNestedList header={<a href="/library/maps">Maps</a>}>
                            {maps.map((map) => (
                                <ESNestedListItem>{map.name}</ESNestedListItem>
                            ))}
                        </ESNestedList>
                        <ESNestedList header={<a href="/library/templates">Node Templates</a>}>
                            {templates.map((template) => (
                                <ESNestedListItem>
                                    <a href={`/template/${template.templateId}`}>{template.name}</a>
                                </ESNestedListItem>
                            ))}
                        </ESNestedList>
                    </SidebarMenuList>
                    <SidebarMenuList header="Resources" icon={<FileText />}>
                        <ESNestedListItem noDisc>
                            <a href="https://esnet.atlassian.net/wiki/spaces/MAAG/pages/3186196481/Terranova+Documentation">
                                Documentation
                            </a>
                        </ESNestedListItem>
                        {showSettings && (
                            <ESNestedListItem noDisc>
                                <a href="/settings">Settings</a>
                            </ESNestedListItem>
                        )}
                    </SidebarMenuList>
                </nav>
            )}
        </div>
    );
}
