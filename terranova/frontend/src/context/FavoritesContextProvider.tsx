import { UserDataController } from "../context/UserDataContextProvider";
import { useState, useEffect, createContext, useContext } from "react";
import { DataControllerContextType, HomePageContextType } from "../types/mapeditor";
import { API_URL } from "../../static/settings";
import { setAuthHeaders } from "../DataController";

export const Favorites = createContext<HomePageContextType | null>(null);

export function FavoritesContextProvider(props: any) {
    let { controller: userDataController, instance: userdata } = useContext(
        UserDataController
    ) as DataControllerContextType;
    let [favorites, setFavorites] = useState<any>({
        maps: [],
        datasets: [],
        templates: [],
    });

    // do the lookup/fetch/store cycle here
    useEffect(() => {
        // "keys" will be ["maps", "datasets", "templates"]
        let keys = Object.keys(userDataController.instance?.favorites);
        // lookup used below for corresponding ID field names
        let idFields = { maps: "mapId", datasets: "datasetId", templates: "templateId" };
        keys.forEach(async (datatype) => {
            // serialize the favorites list for this datatype as the cache key,
            // e.g. '["a","b","c"]'
            let cacheKey =
                `favorites.${datatype}` +
                JSON.stringify(userDataController.instance?.favorites[datatype]);
            // the idea here is that if/when the favorites list changes,
            // we will "transparently" detect the change and use a new key,
            // vending a miss here: ('hit' will be falsy)
            let hit = localStorage.getItem(cacheKey);
            // if we have a cache hit -- set it on the object and stop
            if (hit) {
                hit = JSON.parse(hit);
                favorites[datatype] = hit;
                setFavorites({ ...favorites });
                return;
            }
            // now, if we have an array of IDs to work with,
            // we'll want to make a request to get matching favorite items.
            if (
                Array.isArray(userDataController.instance?.favorites?.[datatype]) &&
                userDataController.instance.favorites?.[datatype].length > 0
            ) {
                // getString will be a string like
                // mapId=a&mapId=b&mapId=c
                // @ts-ignore
                // prettier-ignore
                let getString = userDataController.instance?.favorites?.[datatype]?.map((id: any) => `${idFields[datatype]}=${id}`).join("&");

                let apiUrl = `${API_URL}/${datatype}/?${getString}`;
                let headers = {
                    "Content-Type": "application/json",
                } as any;
                headers = setAuthHeaders(headers);
                let response = await fetch(apiUrl, { headers: headers, method: "GET" });
                if (response.ok) {
                    let output = await response.json();
                    // @ts-ignore
                    const ids = output.map((obj: any) => obj[idFields[datatype]]);
                    favorites[datatype] = ids;
                    setFavorites({ ...favorites });
                    localStorage.setItem(cacheKey, JSON.stringify(ids));
                }
            }
        });
    }, [userDataController.instance]);

    return <Favorites.Provider value={favorites}>{props.children}</Favorites.Provider>;
}
