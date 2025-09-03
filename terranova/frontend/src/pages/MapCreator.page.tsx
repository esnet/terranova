import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { DataController } from "../DataController";
import { DataControllerType, DataControllerContextType } from "../types/mapeditor";
import { MapCreatorForm } from "../components/MapCreatorForm";
import { API_URL } from "../../static/settings";
import { DEFAULT_MAP, DEFAULT_LAYER_CONFIGURATION } from "../data/constants";

export const MapListDataController = createContext<DataControllerContextType | null>(null);

export function MapCreatorPageComponent() {
    const navigate = useNavigate();
    // create some state here for the form
    const [formOptions, setFormOptions] = useState({
        name: "",
        fork: false,
        forkMap: "",
        forkMapVersion: "",
    });
    // set up some state variables for the controller to work with
    const [mapList, setMapList] = useState([]);

    // put togther the finalized API call query string
    // Why are we requesting so many 'fields'? The default response
    // only includes mapId, name, version, lastUpdatedBy, lastUpdatedOn.
    // we want to request all fields. To do that, enumerate them all.
    const fieldsetString =
        "?fields=mapId&fields=name&fields=version&fields=overrides&fields=configuration" +
        "&fields=lastUpdatedBy&fields=lastUpdatedOn&version=all";

    // set up the DataController
    const [controller, _setController] = useState<DataControllerType>(
        new DataController(`${API_URL}/maps/${fieldsetString}`, mapList, setMapList)
    ) as any;

    // trigger a fetch of the map list on initial load (empty list signifies this)
    useEffect(() => {
        // trigger map list fetch
        controller.fetch();
    }, []); // on initial render

    // get some information from the DataController (set of options for 'select' elements, e.g.)
    async function createMap(event: any) {
        event.preventDefault();
        let newMap = JSON.parse(JSON.stringify(DEFAULT_MAP));
        newMap.name = formOptions.name;
        // TODO: this `for` loop is for testing only. We don't want the "real"
        // version to start with exactly LAYER_LIMIT layers.
        // currently, the engagemap code expects at least one topology
        // layer and at least one layer config. The code needs to be updated
        // to 0 or more layers for Terranova.
        let layerConfig = { ...DEFAULT_LAYER_CONFIGURATION };
        layerConfig.name = `Layer 1`;
        newMap.configuration.layers.push(layerConfig);
        if (formOptions.fork) {
            mapList.forEach((mapToFork: any) => {
                if (
                    formOptions.forkMap &&
                    mapToFork.mapId == formOptions.forkMap &&
                    formOptions.forkMapVersion &&
                    mapToFork.version == formOptions.forkMapVersion
                ) {
                    newMap.overrides = mapToFork.overrides;
                    newMap.configuration = mapToFork.configuration;
                }
            });
        }
        // persistence controller
        let MapPersistenceController = new DataController(API_URL + "/map/", newMap, null);
        await MapPersistenceController.create();
        navigate(`/map/${MapPersistenceController.instance.mapId}`);
    }

    return (
        <MapListDataController.Provider value={{ controller, instance: mapList }}>
            <main className="main-content md:flex">
                <div className="w-full md:w-6/12 mx-auto pt-6 pb-12">
                    <MapCreatorForm
                        instance={formOptions}
                        instanceSetter={setFormOptions}
                        mapList={mapList}
                        createMap={createMap}
                    ></MapCreatorForm>
                </div>

                <div className="md:w-5/12 mx-auto mb-6">
                    <fieldset className="content-sidebar">
                        <h4>Create New Map</h4>
                        <p>
                            A Map is a combination of multiple layers that are plotted on your
                            network map along with styling information. To render a map, we import
                            datasets. Each dataset yields a set of nodes or edges.
                        </p>

                        <p className="my-2 mt-6 block">
                            <strong>Fork Existing Map</strong>
                        </p>

                        <p>
                            One way to create a new map is to make a fork of an existing one &mdash;
                            which will copy the previous map with the same styling and make a new
                            map.
                        </p>
                    </fieldset>
                </div>
            </main>
        </MapListDataController.Provider>
    );
}
