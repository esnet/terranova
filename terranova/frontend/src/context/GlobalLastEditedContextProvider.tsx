import { UserDataController } from "../context/UserDataContextProvider";
import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { API_URL, CACHE_DURATION_IN_SECONDS } from "../../static/settings";
import { DataControllerContextType, HomePageContextType } from "../types/mapeditor";
import { setAuthHeaders } from "../DataController";

export const GlobalLastEdited = createContext<HomePageContextType | null>(null);
export const GlobalLastEditedRefresh = createContext<(() => void) | null>(null);

const DATATYPES = ["maps", "datasets", "templates"] as const;

function clearGlobalLastEditedCache() {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("globalLastEdited.")) keysToRemove.push(key);
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
}

export function GlobalLastEditedContextProvider(props: any) {
    let { controller: userDataController, instance: userdata } = useContext(
        UserDataController
    ) as DataControllerContextType;

    let [globalLastEdited, setGlobalLastEdited] = useState<any>({});

    const fetchAll = useCallback(async () => {
        const result: any = {};
        await Promise.all(
            DATATYPES.map(async (datatype) => {
                let timePrecisionKeyPart = (Date.now() / 1000 / CACHE_DURATION_IN_SECONDS).toFixed(0);
                let cacheKey = `globalLastEdited.${datatype}.${timePrecisionKeyPart}`;
                let hit = localStorage.getItem(cacheKey);
                if (hit) {
                    result[datatype] = JSON.parse(hit);
                    return;
                }
                let getString = `?sort=-lastUpdatedBy&offset=0&limit=3`;
                let apiUrl = `${API_URL}/${datatype}/${getString}`;
                let headers = { "Content-Type": "application/json" } as any;
                headers = setAuthHeaders(headers);
                let response = await fetch(apiUrl, { headers, method: "GET" });
                if (response.ok) {
                    let output = await response.json();
                    result[datatype] = output;
                    localStorage.setItem(cacheKey, JSON.stringify(output));
                }
            })
        );
        setGlobalLastEdited({ ...result });
    }, []);

    const refresh = useCallback(() => {
        clearGlobalLastEditedCache();
        fetchAll();
    }, [fetchAll]);

    useEffect(() => {
        fetchAll();
    }, []);

    return (
        <GlobalLastEditedRefresh.Provider value={refresh}>
            <GlobalLastEdited.Provider value={globalLastEdited}>
                {props.children}
            </GlobalLastEdited.Provider>
        </GlobalLastEditedRefresh.Provider>
    );
}
