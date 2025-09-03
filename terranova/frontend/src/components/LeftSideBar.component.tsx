import { createContext, useContext, useState, useEffect } from "react";
import { MenuList } from "./Menu.component";
import { DataController } from "../DataController";
import { LastEdited } from "../context/LastEditedContextProvider";
import { GlobalLastEdited } from "../context/GlobalLastEditedContextProvider";
import { SIDEBAR_STRUCTURE, SIDEBAR_STRUCTURE_TEMPLATES_ITEM } from "../data/constants";
import { DataControllerContextType, DataControllerType } from "../types/mapeditor";
import { API_URL, PUBLISH_SCOPE, ADMIN_SCOPE } from "../../static/settings";
import { setAuthHeaders } from "../DataController";
import { Icon } from "./Icon.component";
import { useAuth } from "../AuthService";

export const SidebarDataController = createContext<DataControllerContextType | null>(null);

export function LeftSideBar() {
    let showTemplates = false;
    let showSettings = false;
    let auth = useAuth();

    if (auth?.user?.scope && auth.user.scope.indexOf(PUBLISH_SCOPE) > 0) {
        showTemplates = true;
    }
    if (auth?.user?.scope && auth.user.scope.indexOf(ADMIN_SCOPE) > 0) {
        showSettings = true;
    }

    let [navigationItems, setNavigationItems] = useState(
        JSON.parse(JSON.stringify(SIDEBAR_STRUCTURE))
    );

    let lastEdited = useContext(LastEdited);
    let lastGlobal = useContext(GlobalLastEdited);

    let [maps, setMaps] = useState([]);
    let [datasets, setDatasets] = useState([]);
    let [templates, setTemplates] = useState([]);

    const [controller] = useState<DataControllerType>(
        new DataController(null, navigationItems, setNavigationItems)
    ) as any;

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

    return (
        <SidebarDataController.Provider value={{ controller, instance: navigationItems }}>
            <div className="toolbar nav-list">
                <div className="relative h-full">
                    <MenuList item={navigationItems}></MenuList>
                    {showSettings ? (
                        <div className="absolute bottom-0">
                            <div className="nav-head compound justify-start">
                                <Icon
                                    name="settings"
                                    className="icon align-middle inline hover:bg-transparent"
                                ></Icon>
                                <a href="/settings">Settings</a>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </SidebarDataController.Provider>
    );
}
