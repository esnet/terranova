import { useEffect, useState, useContext } from "react";
import { API_URL } from "../../static/settings";
import { Icon } from "./Icon.component";
import { ClipboardCopyInput } from "./ClipboardCopyInput.component";
import { DataController } from "../DataController";
import { DataControllerType, DataControllerContextType } from "../types/mapeditor";
import { Favorites } from "../context/FavoritesContextProvider";
import { UserDataController } from "../context/UserDataContextProvider";
import React from "react";

// @ts-ignore
const markFavorite = (userDataController, favorites, datatype, id) => {
    if (favorites?.[datatype]?.includes(id)) {
        const index = favorites?.[datatype]?.indexOf(id);
        favorites?.[datatype]?.splice(index, 1);
        userDataController.setProperty(`favorites`, favorites);
        userDataController.update();
    } else {
        favorites?.[datatype]?.push(id);
        userDataController.setProperty(`favorites`, favorites);
        userDataController.update();
    }
};

export function DatasetLibraryCard() {
    let [datasetList, setDatasetList] = useState([]);
    let [filterText, setFilterText] = useState("");

    let favorites = useContext(Favorites);
    let { controller: userDataController, instance: userdata } = useContext(
        UserDataController
    ) as DataControllerContextType;

    function buildDatasetLibrary(datasets: any) {
        let datasetLibrary = [];
        for (const [key, values] of Object.entries(datasets) as [string, any]) {
            var selectBody = values.map((value: any) => {
                return (
                    <option key={`${value.datasetId} + ${value.version}`} value="{value.version}">
                        version {value.version} ({value.lastUpdatedBy})
                    </option>
                );
            });
            if (values.length > 0) {
                let dataset = (
                    <fieldset className="main-page-panel" key={key}>
                        <div className="flex compound">
                            <div className="name">
                                {favorites?.datasets?.includes(values[0].datasetId) ? (
                                    <Icon
                                        name={"star"}
                                        fill="#00a0d6"
                                        className="icon md my-auto"
                                        onClick={() =>
                                            markFavorite(
                                                userDataController,
                                                favorites,
                                                "datasets",
                                                values[0].datasetId
                                            )
                                        }
                                    ></Icon>
                                ) : (
                                    <Icon
                                        name={"star"}
                                        className="icon md my-auto"
                                        onClick={() =>
                                            markFavorite(
                                                userDataController,
                                                favorites,
                                                "datasets",
                                                values[0].datasetId
                                            )
                                        }
                                    ></Icon>
                                )}
                                <a href={`/dataset/${key}`}>{values[0].name}</a>
                            </div>
                            <div className="justify-end mb-2">
                                <label className="block">Versions:</label>
                                <select id="versions" name="versions">
                                    {selectBody}
                                </select>
                            </div>
                            <div className="flex text-esnetblack-500">
                                Last Updated: {values[0].lastUpdatedOn}
                            </div>
                            <div className="flex text-esnetblack-500">
                                Last Updated By: {values[0].lastUpdatedBy}
                            </div>
                        </div>
                    </fieldset>
                );
                datasetLibrary.push(dataset);
            }
        }
        return datasetLibrary;
    }

    // put togther the finalized API call query string (show example)
    const fieldsetString =
        "?fields=datasetId&fields=name&fields=version" +
        "&fields=lastUpdatedBy&fields=lastUpdatedOn&version=all";

    // set up the DataController
    const [controller, _setController] = useState<DataControllerType>(
        new DataController(API_URL + "/datasets/" + fieldsetString, datasetList, setDatasetList)
    ) as any;

    useEffect(() => {
        const fetchDatasets = async () => {
            await controller.fetch();
        };
        fetchDatasets();
    }, []);

    let filteredItems = datasetList;
    filteredItems = datasetList.filter(
        (item: any) => item.name && item.name.toLowerCase().includes(filterText?.toLowerCase())
    );

    // Create new datastructure
    let datasets: any = {};
    filteredItems.forEach((dataset: any) => {
        let id = dataset.datasetId;
        if (id in datasets) {
            datasets[id].push(dataset);
        } else {
            datasets[id] = [dataset];
        }
    });

    return (
        <div className="library-card">
            <div className="main-content-header compound">
                <div className="flex flex-row">Dataset Library</div>
            </div>
            <div className="compound">
                <div className="justify-start compound">
                    <form action="/dataset/new">
                        <input type="submit" className="btn primary m-4" value="+ Create New" />
                    </form>
                </div>
                <div className="justify-end compound">
                    <input
                        type="text"
                        className="m-4"
                        placeholder="Filter by name..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value ? e.target.value : "")}
                    />
                </div>
            </div>
            <div className="grid grid-cols-2">
                {Object.keys(datasets).length > 0 ? (
                    buildDatasetLibrary(datasets)
                ) : (
                    <div className="text-center">
                        <h4>Loading...</h4>
                    </div>
                )}
            </div>
        </div>
    );
}

export function MapLibraryCard() {
    let [mapList, setMapList] = useState([]);
    let [filterText, setFilterText] = useState("");
    let favorites = useContext(Favorites);
    let { controller: userDataController, instance: userdata } = useContext(
        UserDataController
    ) as DataControllerContextType;

    function buildMapLibrary(maps: any) {
        let mapLibrary = [];
        for (const [key, values] of Object.entries(maps) as [string, any]) {
            if (values.length > 0) {
                let map = (
                    <fieldset className="main-page-panel" key={key}>
                        <div className="name">
                            {favorites?.maps?.includes(values[0].mapId) ? (
                                <Icon
                                    name={"star"}
                                    fill="#00a0d6"
                                    className="icon md my-auto"
                                    onClick={() =>
                                        markFavorite(
                                            userDataController,
                                            favorites,
                                            "maps",
                                            values[0].mapId
                                        )
                                    }
                                ></Icon>
                            ) : (
                                <Icon
                                    name={"star"}
                                    className="icon md my-auto"
                                    onClick={() =>
                                        markFavorite(
                                            userDataController,
                                            favorites,
                                            "maps",
                                            values[0].mapId
                                        )
                                    }
                                ></Icon>
                            )}
                            <a href={`/map/${key}`}>{values[0].name}</a>
                        </div>
                        <div className="p-4">
                            <ClipboardCopyInput
                                label="URL"
                                iconName="clipboard-copy"
                                defaultValue={`${API_URL}/output/map/${key}`}
                            ></ClipboardCopyInput>
                        </div>
                        <div className="flex text-esnetblack-500 px-4">
                            Last Updated: {values[0].lastUpdatedOn}
                        </div>
                        <div className="flex text-esnetblack-500 px-4">
                            Last Updated By: {values[0].lastUpdatedBy}
                        </div>
                    </fieldset>
                );
                mapLibrary.push(map);
            }
        }
        return mapLibrary;
    }

    // put togther the finalized API call query string (show example)
    const fieldsetString =
        "?fields=mapId&fields=name&fields=version" +
        "&fields=lastUpdatedBy&fields=lastUpdatedOn&version=all";

    // set up the DataController
    const [controller, _setController] = useState<DataControllerType>(
        new DataController(API_URL + "/maps/" + fieldsetString, mapList, setMapList)
    ) as any;

    useEffect(() => {
        const fetchDatasets = async () => {
            await controller.fetch();
        };
        fetchDatasets();
    }, []);

    let filteredItems = mapList;
    filteredItems = mapList.filter(
        (item: any) => item.name && item.name.toLowerCase().includes(filterText?.toLowerCase())
    );

    // Create new datastructure
    let maps: any = {};
    filteredItems.forEach((map: any) => {
        let id = map.mapId;
        if (!(id in maps)) {
            maps[id] = [map];
        }
    });

    return (
        <div className="library-card">
            <div className="main-content-header compound">
                <div className="flex flex-row">Map Library</div>
            </div>
            <div className="compound">
                <div className="justify-start compound">
                    <form action="/map/new">
                        <input type="submit" className="btn primary m-4" value="+ Create New" />
                    </form>
                </div>
                <div className="justify-end compound">
                    <input
                        type="text"
                        className="m-4"
                        placeholder="Filter by name..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value ? e.target.value : "")}
                    />
                </div>
            </div>
            <div className="grid grid-cols-2">
                {Object.keys(maps).length > 0 ? (
                    buildMapLibrary(maps)
                ) : (
                    <div className="text-center">
                        <h4>Loading...</h4>
                    </div>
                )}
            </div>
        </div>
    );
}

export function TemplateLibraryCard() {
    let [templateList, setTemplateList] = useState([]);
    let [filterText, setFilterText] = useState("");
    let container = React.createRef<HTMLDivElement>();
    let crosshairs = `<line
        x1="0"
        y1="-25"
        x2="0"
        y2="25"
        stroke-dasharray="1,1"
        stroke="rebeccapurple"
        stroke-width="0.1"
        stroke-opacity="0.5" />
      <line
        x1="-25"
        y1="0"
        x2="25"
        y2="0"
        stroke-dasharray="1,1"
        stroke="rebeccapurple"
        stroke-width="0.1"
        stroke-opacity="0.5" />`;

    let favorites = useContext(Favorites);
    let { controller: userDataController, instance: userdata } = useContext(
        UserDataController
    ) as DataControllerContextType;

    function buildTemplateLibrary(templates: any) {
        let templateLibrary = [];
        for (const [key, values] of Object.entries(templates) as [string, any]) {
            if (values.length > 0) {
                let template = (
                    <fieldset className="main-page-panel" key={key}>
                        <div className="flex compound">
                            <div className="name">
                                {favorites?.templates?.includes(values[0].templateId) ? (
                                    <Icon
                                        name={"star"}
                                        fill="#00a0d6"
                                        className="icon md my-auto"
                                        onClick={() =>
                                            markFavorite(
                                                userDataController,
                                                favorites,
                                                "templates",
                                                values[0].templateId
                                            )
                                        }
                                    ></Icon>
                                ) : (
                                    <Icon
                                        name={"star"}
                                        className="icon md my-auto"
                                        onClick={() =>
                                            markFavorite(
                                                userDataController,
                                                favorites,
                                                "templates",
                                                values[0].templateId
                                            )
                                        }
                                    ></Icon>
                                )}
                                <a href={`/template/${key}`}>{values[0].name}</a>
                            </div>
                        </div>
                        <br />
                        <div className="flex p-4">
                            <div className="template-preview w-32 h-32" ref={container}>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="-25 -25 50 50"
                                    dangerouslySetInnerHTML={{
                                        __html: `${values[0].template}${crosshairs}`,
                                    }}
                                ></svg>
                            </div>
                            <div className="px-2">
                                <div className="flex text-esnetblack-500 px-4">
                                    Last Updated On: {values[0].lastUpdatedOn}
                                </div>
                                <div className="flex text-esnetblack-500 px-4">
                                    Last Updated By: {values[0].lastUpdatedBy}
                                </div>
                            </div>
                        </div>
                    </fieldset>
                );
                templateLibrary.push(template);
            }
        }
        return templateLibrary;
    }

    // put togther the finalized API call query string (show example)
    const fieldsetString =
        "?fields=templateId&fields=name&fields=version" +
        "&fields=lastUpdatedBy&fields=lastUpdatedOn&fields=template&version=all";

    // set up the DataController
    const [controller, _setController] = useState<DataControllerType>(
        new DataController(API_URL + "/templates/" + fieldsetString, templateList, setTemplateList)
    ) as any;

    useEffect(() => {
        const fetchDatasets = async () => {
            await controller.fetch();
        };
        fetchDatasets();
    }, []);

    let filteredItems = templateList;
    filteredItems = templateList.filter(
        (item: any) => item.name && item.name.toLowerCase().includes(filterText?.toLowerCase())
    );

    // Create new datastructure
    let templates: any = {};
    filteredItems.forEach((template: any) => {
        let id = template.templateId;
        if (!(id in templates)) {
            templates[id] = [template];
        }
    });

    return (
        <div className="library-card">
            <div className="main-content-header compound">
                <div className="flex flex-row">Template Library</div>
            </div>
            <div className="compound">
                <div className="justify-start compound">
                    <form action="/template/new">
                        <input type="submit" className="btn primary m-4" value="+ Create New" />
                    </form>
                </div>
                <div className="justify-end compound">
                    <input
                        type="text"
                        className="m-4"
                        placeholder="Filter by name..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value ? e.target.value : "")}
                    />
                </div>
            </div>
            <div className="grid grid-cols-2">
                {Object.keys(templates).length > 0 ? (
                    buildTemplateLibrary(templates)
                ) : (
                    <div className="text-center">
                        <h4>Loading...</h4>
                    </div>
                )}
            </div>
        </div>
    );
}
