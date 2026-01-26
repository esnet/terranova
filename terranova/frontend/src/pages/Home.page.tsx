import { useAuth } from "../AuthService";
import React, { useContext, useEffect, useState } from "react";
import { API_URL, ADMIN_SCOPE } from "../../static/settings";
import Card from "../components/Card";
import { ESIconButton } from "@esnet/packets-ui";
import { Favorites } from "../context/FavoritesContextProvider";
import { LastEdited } from "../context/LastEditedContextProvider";
import { Database, History, Map, MapPin, Star } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";

export function HomePageComponent() {
    const auth = useAuth();
    const navigation = useNavigate();

    const sortOnUpdate = (a: any, b: any) => b.lastUpdatedOn - a.lastUpdatedOn;

    const lastEdited = useContext(LastEdited);
    const favorites = useContext(Favorites);

    // maps to be shown under recent
    let [topMaps, setTopMaps] = useState<any[]>([]);
    let [topDatasets, setTopDatasets] = useState<any[]>([]);
    let [topTemplates, setTopTemplates] = useState<any[]>([]);

    // maps to be shown under favorites
    let [favMaps, setFavMaps] = useState<any[]>([]);
    let [favDatasets, setFavDatasets] = useState<any[]>([]);
    let [favTemplates, setFavTemplates] = useState<any[]>([]);

    useEffect(() => {
        if (!lastEdited) return;
        topMaps = lastEdited.maps?.sort(sortOnUpdate).slice(0, 3);
        setTopMaps([...topMaps]);

        topDatasets = lastEdited.datasets?.sort(sortOnUpdate).slice(0, 3);
        setTopDatasets([...topDatasets]);

        topTemplates = lastEdited.templates?.sort(sortOnUpdate).slice(0, 3);
        setTopTemplates([...topTemplates]);
    }, [lastEdited]);

    useEffect(() => {
        if (!favorites) return;
        setFavMaps([...favorites.maps.sort()]);
        setFavDatasets([...favorites.datasets.sort()]);
        setFavTemplates([...favorites.templates.sort()]);
    }, [favorites]);

    const showTemplates = auth?.user?.scope?.includes(ADMIN_SCOPE);

    return (
        <main className="w-full h-full flex flex-col md:flex-row-reverse gap-8 p-8 relative">
            <div className="md:flex-1">
                <Card header="My Favorites" icon={<Star />}>
                    <h4>My Datasets</h4>
                    <FavLinkList links={favDatasets} dataType="datasets" />
                    <h4>My Maps</h4>
                    <FavLinkList links={favMaps} dataType="maps" />
                    {showTemplates && (
                        <>
                            <h4>My Templates</h4>
                            <FavLinkList links={favTemplates} dataType="templates" />
                        </>
                    )}
                </Card>
            </div>
            <div className="w-full h-fit md:w-2/3 flex flex-col gap-8 pb-8">
                <Card header="Recent Activity" icon={<History />}>
                    <h4>Recent Maps</h4>
                    <LinkTable links={topMaps} dataType="maps" />
                    <h4>Recent Datasets</h4>
                    <LinkTable links={topDatasets} dataType="datasets" />
                    {showTemplates && (
                        <>
                            <h4>Recent Node Templates</h4>
                            <LinkTable links={topTemplates} dataType="templates" />
                        </>
                    )}
                </Card>
                <Card
                    header={<Link to="/library/datasets">Datasets</Link>}
                    icon={<Database />}
                    headerButton={
                        <ESIconButton
                            variant="secondary"
                            square
                            name="plus"
                            onClick={() => {
                                navigation("/dataset/new");
                            }}
                        />
                    }
                >
                    <h4>About Datasets</h4>
                    <p>
                        A Dataset is a set of data to be plotted on your map. To render a dataset,
                        we create a query that yields a set of nodes. Datasets are later used to
                        bundled together into a finished map, which also includes styling
                        information.
                    </p>
                </Card>
                <Card
                    header={<Link to="/library/maps">Maps</Link>}
                    icon={<Map />}
                    headerButton={
                        <ESIconButton
                            variant="secondary"
                            square
                            name="plus"
                            onClick={() => {
                                navigation("/map/new");
                            }}
                        />
                    }
                >
                    <h4>About Maps</h4>
                    <p>
                        A Map is a combination of one or more datasets that are plotted on your map
                        along with the styling information. To render a map, we import datasets.
                        Datasets yield a set of nodes and edges, which are then arranged into map
                        layers.
                    </p>
                </Card>
                <Card
                    header={<Link to="/library/templates">Node Templates</Link>}
                    icon={<MapPin />}
                    headerButton={
                        showTemplates ? (
                            <ESIconButton
                                variant="secondary"
                                square
                                name="plus"
                                onClick={() => {
                                    navigation("/template/new");
                                }}
                            />
                        ) : undefined
                    }
                >
                    <h4>About Node Templates</h4>
                    <p>
                        A Node Template is a way to represent a node on your map. Different
                        templates represent different types of node points, represented by different
                        SVGs on your map.
                    </p>
                    <p>Only administrators can create or edit Node Templates.</p>
                </Card>
            </div>
        </main>
    );
}

// Sub-components of the home page, may be moved to separate file if a need is found for their re-use.
type LinkTableProps = {
    links: any[];
    dataType: "maps" | "datasets" | "templates";
};
function LinkTable({ links, dataType }: LinkTableProps) {
    const id = {
        maps: "mapId",
        datasets: "datasetId",
        templates: "templateId",
    }[dataType];

    if (links.length === 0) {
        return <p>You have not edited any {dataType} recently.</p>;
    }

    return (
        <ul className="pl-2">
            {links.map((item, i) => {
                const url = new URL(
                    `/${dataType}/${item[id]}/?version=latest`,
                    window.location.origin,
                );
                const mapUrl = new URL(`/output/${dataType}/${item[id]}/?version=latest`, API_URL);
                return (
                    <li key={item[id]} className="list-none flex items-center gap-4 mb-2">
                        {dataType === "maps" && (
                            <ESIconButton
                                onClick={() => {
                                    navigator.clipboard.writeText(mapUrl.href);
                                }}
                                variant="secondary"
                                name="copy"
                            />
                        )}
                        <a className="font-semibold" href={url.href}>
                            {item["name"]}
                        </a>
                    </li>
                );
            })}
        </ul>
    );
}

type FavLinkListProps = {
    links: any[];
    dataType: "maps" | "datasets" | "templates";
};
function FavLinkList({ links, dataType }: FavLinkListProps) {
    if (links.length === 0) {
        return <p>You have not marked any {dataType} as favorite.</p>;
    }
    return (
        <ul>
            {links.map((item) => (
                <li key={item["datasetId"]}>
                    <a href={`/dataset/${item["datasetId"]}`}>{item["name"]}</a>
                </li>
            ))}
        </ul>
    );
}
