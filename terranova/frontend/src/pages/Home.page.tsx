/*
    This component will handle the home page
    If a user is logged in, this will display stuff such as
        - Recently saved topologies by that user
        - Starred maps
        - Layers / Maps created by the user
    If a user isn't logged in, this should redirect or show the login page
*/
import { NavBar } from "../components/NavBar";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/SideBar";
import { UserDataContextProvider } from "../context/UserDataContextProvider";
import { FavoritesContextProvider, Favorites } from "../context/FavoritesContextProvider";
import { LastEditedContextProvider, LastEdited } from "../context/LastEditedContextProvider";
import {
    GlobalLastEditedContextProvider,
    GlobalLastEdited,
} from "../context/GlobalLastEditedContextProvider";
import { useAuth } from "../AuthService";
import { Icon } from "../components/Icon.component";
import { CopyIconButton } from "../components/CopyIconButton.component";
import { useContext, useEffect, useState } from "react";
import { ReadOnlyWarning } from "../components/ReadOnlyWarning.component";
import { READ_SCOPE, API_URL, AUTH_BACKEND } from "../../static/settings";
import { setAuthHeaders } from "../DataController";
import { quickhash } from "../data/utils";

export function Home() {
    let auth = useAuth();
    return (
        <div className="w-full h-full" key={quickhash(JSON.stringify(window?.BasicUser || ""))}>
            {auth?.isAuthenticated &&
            auth?.user?.scope &&
            auth.user.scope.indexOf(READ_SCOPE) >= 0 ? (
                <>
                    <NavBar />
                    <ReadOnlyWarning />
                    <UserDataContextProvider>
                        <LastEditedContextProvider>
                            <FavoritesContextProvider>
                                <GlobalLastEditedContextProvider>
                                    <div className="flex relative w-full h-full">
                                        <Sidebar />
                                        <Outlet />
                                    </div>
                                </GlobalLastEditedContextProvider>
                            </FavoritesContextProvider>
                        </LastEditedContextProvider>
                    </UserDataContextProvider>
                </>
            ) : (
                <Outlet />
            )}
        </div>
    );
}

export function HomePageComponent() {
    function renderIcon(name: string | undefined) {
        if (!name) return null;
        return <Icon name={name} className="icon btn"></Icon>;
    }

    function renderIconLarge(name: string | undefined) {
        if (!name) return null;
        return (
            <Icon
                name={name}
                className="icon lg mt-4 mr-4 align-middle inline hover:bg-transparent"
            ></Icon>
        );
    }

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

    let lastEdited = useContext(LastEdited);
    let lastGlobal = useContext(GlobalLastEdited);
    let favorites = useContext(Favorites);

    // Global
    let [topMaps, setTopMaps] = useState([]);
    let [topDatasets, setTopDatasets] = useState([]);
    let [topTemplates, setTopTemplates] = useState([]);

    // User
    let [myTopMaps, setMyTopMaps] = useState([]);
    let [myTopDatasets, setMyTopDatasets] = useState([]);
    let [myTopTemplates, setMyTopTemplates] = useState([]);

    let [favMaps, setFavMaps] = useState([]);
    let [favDatasets, setFavDatasets] = useState([]);
    let [favTemplates, setFavTemplates] = useState([]);

    const fetchLastEditedDetails = async (dataType: string, idType: string) => {
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
                myTopMaps = output;
                setMyTopMaps([...myTopMaps]);
            } else if (dataType === "datasets") {
                myTopDatasets = output;
                setMyTopDatasets([...myTopDatasets]);
            } else if (dataType === "templates") {
                myTopTemplates = output;
                setMyTopTemplates([...myTopTemplates]);
            }
        }
    };

    const fetchFavoriteDetails = async (dataType: string, idType: string) => {
        // getString will be a string like
        // mapId=a&mapId=b&mapId=c
        // @ts-ignore
        let getString = favorites?.[dataType]?.map((id: any) => `${idType}=${id}`).join("&");

        let apiUrl = `${API_URL}/${dataType}/?${getString}`;
        let headers = {
            "Content-Type": "application/json",
        } as any;
        headers = setAuthHeaders(headers);
        let response = await fetch(apiUrl, { headers: headers, method: "GET" });
        if (response.ok) {
            let output = await response.json();
            if (dataType === "maps") {
                favMaps = output.sort(sortDatesDesc);
                setFavMaps([...favMaps]);
            } else if (dataType === "datasets") {
                favDatasets = output.sort(sortDatesDesc);
                setFavDatasets([...favDatasets]);
            } else if (dataType === "templates") {
                favTemplates = output.sort(sortDatesDesc);
                setFavTemplates([...favTemplates]);
            }
        }
    };

    useEffect(() => {
        if (lastGlobal?.maps) {
            topMaps = lastGlobal.maps?.sort(sortDatesDesc).slice(0, 3);
            setTopMaps([...topMaps]);
        }

        if (lastGlobal?.datasets) {
            topDatasets = lastGlobal.datasets?.sort(sortDatesDesc).slice(0, 3);
            setTopDatasets([...topDatasets]);
        }

        if (lastGlobal?.templates) {
            topTemplates = lastGlobal.templates?.sort(sortDatesDesc).slice(0, 3);
            setTopTemplates([...topTemplates]);
        }

        if (lastEdited?.maps?.length > 0) {
            fetchLastEditedDetails("maps", "mapId");
        }

        if (lastEdited?.datasets?.length > 0) {
            fetchLastEditedDetails("datasets", "datasetId");
        }

        if (lastEdited?.templates?.length > 0) {
            fetchLastEditedDetails("templates", "templateId");
        }

        if (favorites?.maps?.length > 0) {
            fetchFavoriteDetails("maps", "mapId");
        }

        if (favorites?.datasets?.length > 0) {
            fetchFavoriteDetails("datasets", "datasetId");
        }

        if (favorites?.templates?.length > 0) {
            fetchFavoriteDetails("templates", "templateId");
        }
    }, [lastEdited, lastGlobal, favorites]);

    return (
        <main className="w-full">
            <div className="homepage-back">
                <div className="homepage-logo"></div>
            </div>
            <div className="main-content bg-transparent border-none lg:flex">
                <div className="w-full lg:w-3/4 xl:w-3/4 mx-auto pt-6">
                    <fieldset className="main-page-panel">
                        {/* This needs to get hooked up to Data Controller! */}
                        <div>
                            <div className="m-2">
                                <h3>Recent Activity</h3>
                            </div>
                            <div className="flex flex-row">
                                <div className="m-2 w-1/2">
                                    <h4>Recent Maps</h4>
                                    <table className="table-auto">
                                        <tbody key={"global-top-maps"}>
                                            {topMaps.map((item, i) => {
                                                let url = `${API_URL}/output/map/${item["mapId"]}/?version=latest`;
                                                return (
                                                    <tr key={item["mapId"]}>
                                                        <td>
                                                            <CopyIconButton
                                                                iconName="clipboard-copy"
                                                                copyValue={url}
                                                                title="Copy URL for Latest Version"
                                                            />
                                                        </td>
                                                        <td>
                                                            <a
                                                                className="font-semibold"
                                                                href={`/map/${item["mapId"]}`}
                                                            >
                                                                {item["name"]}
                                                            </a>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="m-2">
                                    <h4>My Recent Maps</h4>
                                    <table className="table-auto">
                                        <tbody key={"my-top-maps"}>
                                            {myTopMaps.length > 0 ? (
                                                myTopMaps.map((item, i) => {
                                                    let url = `${API_URL}/output/map/${item["mapId"]}/?version=latest`;
                                                    return (
                                                        <tr key={item["mapId"]}>
                                                            <td>
                                                                <CopyIconButton
                                                                    iconName="clipboard-copy"
                                                                    copyValue={url}
                                                                    title="Copy URL for Latest Version"
                                                                />
                                                            </td>
                                                            <td>
                                                                <a
                                                                    className="font-semibold"
                                                                    href={`/map/${item["mapId"]}`}
                                                                >
                                                                    {item["name"]}
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td>You haven't edited any maps recently</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="flex flex-row">
                                <div className="m-2 w-1/2">
                                    <h4>Recent Datasets</h4>
                                    <table className="narrow-p">
                                        <tbody key={"global-top-datasets"}>
                                            {topDatasets.map((item, i) => {
                                                return (
                                                    <tr key={item["datasetId"]}>
                                                        <td>
                                                            <a
                                                                className="font-semibold"
                                                                href={`/dataset/${item["datasetId"]}`}
                                                            >
                                                                {item["name"]}
                                                            </a>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="m-2">
                                    <h4>My Recent Datasets</h4>
                                    <table className="narrow-p">
                                        <tbody key={"my-top-datasets"}>
                                            {myTopDatasets.length > 0 ? (
                                                myTopDatasets.map((item, i) => {
                                                    return (
                                                        <tr key={item["datasetId"]}>
                                                            <td>
                                                                <a
                                                                    className="font-semibold"
                                                                    href={`/dataset/${item["datasetId"]}`}
                                                                >
                                                                    {item["name"]}
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td>
                                                        You haven't edited any datasets recently
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </fieldset>
                    <fieldset className="main-page-panel">
                        <div className="compound">
                            <div className="justify-start compound">
                                <div>{renderIconLarge("database")}</div>
                                <h3>Datasets</h3>
                            </div>
                            <form action="/dataset/new">
                                <input
                                    type="submit"
                                    className="btn primary m-4"
                                    value="+ New Dataset"
                                />
                            </form>
                        </div>
                        <div className="m-2">
                            <h4>About Datasets</h4>
                            <p>
                                A Dataset is a set of data to be plotted on your map. To render a
                                dataset, we create a query that yields a set of nodes. Datasets are
                                later used to bundled together into a finished map, which also
                                includes styling information.
                            </p>
                        </div>
                    </fieldset>
                    <fieldset className="main-page-panel">
                        <div className="compound">
                            <div className="justify-start compound">
                                <div>{renderIconLarge("map")}</div>
                                <h3>Maps</h3>
                            </div>
                            <form action="/map/new">
                                <input
                                    type="submit"
                                    className="btn primary m-4"
                                    value="+ New Map"
                                />
                            </form>
                        </div>
                        <div className="m-2">
                            <h4>About Maps</h4>
                            <p>
                                A Map is a combination of one or more datasets that are plotted on
                                your map along with the styling information. To render a map, we
                                import datasets. Datasets yield a set of nodes and edges, which are
                                then arranged into map layers.
                            </p>
                        </div>
                    </fieldset>
                </div>
                <div className="w-full lg:w-1/3 xl:w-2/5 mx-auto pt-6">
                    <fieldset className="main-page-panel">
                        <h3>My Favorites</h3>
                        {favMaps.length > 0 ? <h4>Maps</h4> : ""}
                        <table className="narrow-p">
                            <tbody>
                                {favMaps.map((item, i) => {
                                    return (
                                        <tr key={item["mapId"]}>
                                            <td>{renderIcon("lucide-map")}</td>
                                            <td>
                                                <a
                                                    className="font-semibold"
                                                    href={`/map/${item["mapId"]}`}
                                                >
                                                    {item["name"]}
                                                </a>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {favDatasets.length > 0 ? <h4>Datasets</h4> : ""}
                        <table>
                            <tbody>
                                {favDatasets.map((item, i) => {
                                    return (
                                        <tr key={item["datasetId"]}>
                                            <td>{renderIcon("lucide-database")}</td>
                                            <td>
                                                <a
                                                    className="font-semibold"
                                                    href={`/dataset/${item["datasetId"]}`}
                                                >
                                                    {item["name"]}
                                                </a>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {favTemplates.length > 0 ? <h4>Templates</h4> : ""}
                        <table>
                            <tbody>
                                {favTemplates.map((item, i) => {
                                    return (
                                        <tr key={item["templateId"]}>
                                            <td>{renderIcon("lucide-map-pin")}</td>
                                            <td>
                                                <a
                                                    className="font-semibold"
                                                    href={`/template/${item["templateId"]}`}
                                                >
                                                    {item["name"]}
                                                </a>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <table>
                            <tbody>
                                {favMaps.length == 0 &&
                                favDatasets.length == 0 &&
                                favTemplates.length == 0 ? (
                                    <tr>
                                        <td>You have not marked any favorites</td>
                                    </tr>
                                ) : (
                                    <tr />
                                )}
                            </tbody>
                        </table>
                    </fieldset>
                </div>
            </div>
        </main>
    );
}
