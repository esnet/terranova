import { UserDataController } from "../context/UserDataContextProvider";
import { useState, useEffect, createContext, useContext } from "react";
import { API_URL, CACHE_DURATION_IN_SECONDS } from "../../static/settings";
import { DataControllerContextType, HomePageContextType } from "../types/mapeditor";
import { setAuthHeaders } from "../DataController";

export const GlobalLastEdited = createContext<HomePageContextType | null>(null);

export function GlobalLastEditedContextProvider(props: any) {
    let { controller: userDataController, instance: userdata } = useContext(
        UserDataController
    ) as DataControllerContextType;

    let [globalLastEdited, setGlobalLastEdited] = useState<any>({});

    // do the lookup/fetch/store cycle here
    useEffect(() => {
        let datatypes = ["maps", "datasets", "templates"];
        datatypes.forEach(async (datatype) => {
            let timePrecisionKeyPart = (Date.now() / 1000 / CACHE_DURATION_IN_SECONDS).toFixed(0);
            let cacheKey = `globalLastEdited.${datatype}.${timePrecisionKeyPart}`;
            let hit = localStorage.getItem(cacheKey);
            // if we have a cache hit -- set it on the object and stop
            if (hit) {
                hit = JSON.parse(hit);
                globalLastEdited[datatype] = hit;
                setGlobalLastEdited({ ...globalLastEdited });
                return;
            }
            // getString for "global top 3"
            let getString = `?sort=-lastUpdatedBy&offset=0&limit=3`;
            // TODO: we need api support for "offset"/"limit" as well as "sort"
            let apiUrl = `${API_URL}/${datatype}/${getString}`;
            let headers = {
                "Content-Type": "application/json",
            } as any;
            headers = setAuthHeaders(headers);
            let response = await fetch(apiUrl, { headers: headers, method: "GET" });
            if (response.ok) {
                let output = await response.json();
                globalLastEdited[datatype] = output;
                setGlobalLastEdited({ ...globalLastEdited });
                localStorage.setItem(cacheKey, JSON.stringify(output));
            }
        });
    }, []); // unsure how this should be triggered.
    // empty array is "on each page load" -- I think!!?

    return (
        <GlobalLastEdited.Provider value={globalLastEdited}>
            {props.children}
        </GlobalLastEdited.Provider>
    );
}
