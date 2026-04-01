import { UserDataController } from "../context/UserDataContextProvider";
import { useState, useEffect, createContext, useContext } from "react";
import { DataControllerContextType, HomePageContextType } from "../types/mapeditor";
import { API_URL } from "../../static/settings";
import { setAuthHeaders } from "../DataController";

/**
 * LastEdited context stores the IDs to maps, datasets, and templates that were edited recently on local device.
 * It does NOT store the data.
 */
export const LastEdited = createContext<HomePageContextType | null>(null);

export function LastEditedContextProvider(props: any) {
    let { controller: userDataController, instance: userdata } = useContext(
        UserDataController,
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
            // Sanitize: keep only string IDs and deduplicate (guards against stale full-object corruption)
            const _id_fields = ["mapId", "datasetId", "templateId"];
            const raw = userDataController.instance?.lastEdited?.[datatype] ?? [];
            const ids: string[] = [...new Set(
                (raw as any[]).map((item: any) => {
                    if (typeof item === "string") return item;
                    for (const f of _id_fields) { if (item?.[f]) return item[f]; }
                    return null;
                }).filter(Boolean)
            )];
            // serialize the lastEdited list for this datatype as the cache key,
            // e.g. '["a","b","c"]'
            let cacheKey =
                `lastEdited.${datatype}` +
                JSON.stringify(ids);
            // if the ID list is empty, clear this datatype's data so stale items don't linger
            if (!Array.isArray(ids) || ids.length === 0) {
                setLastEdited((prev: any) => ({ ...prev, [datatype]: [] }));
                return;
            }
            // the idea here is that if/when the lastEdited list changes,
            // we will "transparently" detect the change and use a new key,
            // vending a miss here: ('hit' will be falsy)
            let hit = localStorage.getItem(cacheKey);
            // if we have a cache hit -- set it on the object and stop
            if (hit) {
                const parsed = JSON.parse(hit);
                setLastEdited((prev: any) => ({ ...prev, [datatype]: parsed }));
                return;
            }
            // fetch full objects for the IDs in the list
            // getString will be a string like mapId=a&mapId=b&mapId=c
            // @ts-ignore
            // prettier-ignore
            let getString = ids.map((id: any) => `${idFields[datatype]}=${id}`).join("&");
            let apiUrl = `${API_URL}/${datatype}/?${getString}`;
            let headers = {
                "Content-Type": "application/json",
            } as any;
            headers = setAuthHeaders(headers);
            let response = await fetch(apiUrl, { headers: headers, method: "GET" });
            if (response.ok) {
                let output = await response.json();

                // Re-order output based on original order of ids (highest index = most recent)
                // @ts-ignore
                const idField = idFields[datatype];
                output.sort(function (a: any, b: any) {
                    const A = a[idField], B = b[idField];
                    // Higher index = more recently added; show newest first.
                    return ids.indexOf(B) - ids.indexOf(A);
                });

                setLastEdited((prev: any) => ({ ...prev, [datatype]: output }));
                localStorage.setItem(cacheKey, JSON.stringify(output));
            }
        });
    }, [userDataController.instance]);

    return <LastEdited.Provider value={lastEdited}>{props.children}</LastEdited.Provider>;
}
