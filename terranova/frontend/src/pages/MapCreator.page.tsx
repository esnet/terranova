import { useState, useEffect } from "react";
import { DataController } from "../DataController";
import { DataControllerType } from "../types/mapeditor";
import { MapCreatorForm } from "../components/MapCreatorForm";
import { API_URL } from "../../static/settings";
import Card from "../components/Card";

/**
 * This page is responsible for the layout of the Map Creator page, which
 * contains the Map Creator form.
 *
 * All logic relating to creating a map is found inside the Map Creator form.
 */
export function MapCreatorPageComponent() {
    // maintain map list to pass to the map creator form
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
        new DataController(`${API_URL}/maps/${fieldsetString}`, mapList, setMapList),
    ) as any;

    // trigger a fetch of the map list on initial load (empty list signifies this)
    useEffect(() => {
        // trigger map list fetch
        controller.fetch();
    }, []); // on initial render

    return (
        <main className="w-full h-full flex flex-col lg:flex-row gap-8 p-8">
            <MapCreatorForm mapList={mapList}></MapCreatorForm>

            <Card className="w-full lg:1/3">
                <h4>Create New Map</h4>
                <p>
                    A Map is a combination of multiple layers that are plotted on your network map
                    along with styling information. To render a map, we import datasets. Each
                    dataset yields a set of nodes or edges.
                </p>

                <h4>Fork Existing Map</h4>

                <p>
                    One way to create a new map is to make a fork of an existing one &mdash; which
                    will copy the previous map with the same styling and make a new map.
                </p>
            </Card>
        </main>
    );
}
