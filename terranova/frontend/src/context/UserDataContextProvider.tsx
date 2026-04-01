import { useAuth } from "../AuthService";
import { useState, createContext, useEffect, useMemo } from "react";
import { DataController } from "../DataController";
import { DEFAULT_USER_DATA } from "../data/constants";
import { DataControllerContextType, DataControllerType } from "../types/mapeditor";
import { API_URL } from "../../static/settings";

export const UserDataController = createContext<DataControllerContextType | null>(null);

export function UserDataContextProvider(props: any) {
    let auth = useAuth();
    const [userData, setUserData] = useState(JSON.parse(JSON.stringify(DEFAULT_USER_DATA)));

    const [controller, setController] = useState<DataControllerType>(
        new DataController(API_URL + "/userdata/", userData, setUserData)
    ) as any;

    let datatypes = ["maps", "datasets", "templates"];
    let categories = ["favorites", "lastEdited", "lastGlobal"];

    // types --> id field name, used below.
    let idNames = {
        maps: "mapId",
        templates: "templateId",
        datasets: "datasetId",
    };

    // trigger a fetch of the user's UI data
    useEffect(() => {
        if (auth?.isAuthenticated) {
            (async () => {
                // trigger user data fetch
                let output = await controller.fetch();
                if (output.status !== 200) {
                    controller.create();
                } else {
                    // Normalize favorites/lastEdited to plain string IDs in case the DB has
                    // stale full-object entries from before the Pydantic validator was in place.
                    const _idFields = ["mapId", "datasetId", "templateId"];
                    const toId = (item: any): string | null => {
                        if (typeof item === "string") return item;
                        for (const f of _idFields) { if (item?.[f]) return item[f]; }
                        return null;
                    };
                    const normalize = (dict: any) => {
                        if (!dict || typeof dict !== "object") return dict;
                        const out: any = {};
                        for (const [k, v] of Object.entries(dict)) {
                            out[k] = [...new Set((v as any[]).map(toId).filter(Boolean))];
                        }
                        return out;
                    };
                    controller.instance.favorites = normalize(controller.instance.favorites);
                    controller.instance.lastEdited = normalize(controller.instance.lastEdited);
                    controller.setInstance({ ...controller.instance });
                }
            })();
        }
    }, [auth?.isAuthenticated]); // on change of isAuthenticated: i.e. when user authenticates

    return (
        <UserDataController.Provider value={{ controller, instance: userData }}>
            {props.children}
        </UserDataController.Provider>
    );
}
