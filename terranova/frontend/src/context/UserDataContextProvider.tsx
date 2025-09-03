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
