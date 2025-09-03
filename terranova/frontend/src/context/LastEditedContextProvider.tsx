import { UserDataController } from "../context/UserDataContextProvider";
import { useState, useEffect, createContext, useContext } from "react";
import { DataControllerContextType, HomePageContextType } from "../types/mapeditor";
import { API_URL } from "../../static/settings";
import { setAuthHeaders } from "../DataController";

export const LastEdited = createContext<HomePageContextType | null>(null);

export function LastEditedContextProvider(props: any) {
    let { controller: userDataController, instance: userdata } = useContext(
        UserDataController
    ) as DataControllerContextType;

    let [lastEdited, setLastEdited] = useState<any>({
        maps: [],
        datasets: [],
        templates: [],
    });

    // do the lookup/fetch/store cycle here
    useEffect(() => {
        // "keys" will be ["maps", "datasets", "templates"]
        let keys = Object.keys(userDataController.instance?.lastEdited);
        // lookup used below for corresponding ID field names
        let idFields = {
            maps: "mapId",
            datasets: "datasetId",
            templates: "templateId",
        };
        keys.forEach(async (datatype) => {
            // serialize the lastEdited list for this datatype as the cache key,
            // e.g. '["a","b","c"]'
            let cacheKey =
                `lastEdited.${datatype}` +
                JSON.stringify(userDataController.instance?.lastEdited[datatype]);
            // the idea here is that if/when the lastEdited list changes,
            // we will "transparently" detect the change and use a new key,
            // vending a miss here: ('hit' will be falsy)
            let hit = localStorage.getItem(cacheKey);
            // if we have a cache hit -- set it on the object and stop
            if (hit) {
                hit = JSON.parse(hit);
                lastEdited[datatype] = hit;
                setLastEdited({ ...lastEdited });
                return;
            }
            // now, if we have an array of IDs to work with,
            // we'll want to make a request to get matching lastEdited items.
            if (
                Array.isArray(userDataController.instance?.lastEdited?.[datatype]) &&
                userDataController.instance.lastEdited?.[datatype].length > 0
            ) {
                // getString will be a string like
                // mapId=a&mapId=b&mapId=c
                // @ts-ignore
                // prettier-ignore
                let getString = userDataController.instance?.lastEdited?.[datatype]?.map((id: any) => `${idFields[datatype]}=${id}`).join("&");
                let apiUrl = `${API_URL}/${datatype}/?${getString}`;
                let headers = {
                    "Content-Type": "application/json",
                } as any;
                headers = setAuthHeaders(headers);
                let response = await fetch(apiUrl, { headers: headers, method: "GET" });
                if (response.ok) {
                    let output = await response.json();

                    // Re-order output based on original order of id's
                    let order = userDataController.instance?.lastEdited?.[datatype];
                    output.sort(function (a: any, b: any) {
                        var A = a["mapId"],
                            B = b["mapId"];
                        if (order.indexOf(A) > order.indexOf(B)) {
                            return 1;
                        } else {
                            return -1;
                        }
                    });

                    // @ts-ignore
                    const ids = output.map((obj: any) => obj[idFields[datatype]]);
                    lastEdited[datatype] = ids;
                    setLastEdited(JSON.parse(JSON.stringify(lastEdited)));
                    localStorage.setItem(cacheKey, JSON.stringify(ids));
                }
            }
        });
    }, [userDataController.instance]);

    return <LastEdited.Provider value={lastEdited}>{props.children}</LastEdited.Provider>;
}
