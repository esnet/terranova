import React, { useEffect, useState, useContext } from "react";
import { API_URL } from "../../../static/settings";
import { DataController } from "../../DataController";
import { DataControllerType, DataControllerContextType } from "../../types/mapeditor";
import { Favorites } from "../../context/FavoritesContextProvider";
import { UserDataController } from "../../context/UserDataContextProvider";
import { markFavorite } from "./utils";
import Card from "../Card";
import {
    PktsInputText,
    PktsButton,
    PktsSpinner,
    PktsInputSelect,
    PktsInputOption,
    PktsInputRow,
} from "@esnet/packets-ui-react";
import { Plus, Star } from "lucide-react";
import { Link } from "react-router-dom";

export function DatasetLibrary() {
    const [datasetList, setDatasetList] = useState([]);
    const [filterText, setFilterText] = useState("");
    const [loading, setLoading] = useState(true);

    const favorites = useContext(Favorites);
    const { controller: userDataController } = useContext(
        UserDataController,
    ) as DataControllerContextType;

    const fieldsetString =
        "?fields=datasetId&fields=name&fields=version" +
        "&fields=lastUpdatedBy&fields=lastUpdatedOn&version=all";

    const [controller] = useState<DataControllerType>(
        new DataController(
            API_URL + "/datasets/" + fieldsetString,
            datasetList,
            setDatasetList,
        ) as any,
    );

    useEffect(() => {
        const fetchDatasets = async () => {
            setLoading(true);
            await controller.fetch();
            setLoading(false);
        };
        fetchDatasets();
    }, []);

    // 1. Filter items by text
    const filteredItems = datasetList.filter((item: any) =>
        item.name?.toLowerCase().includes(filterText.toLowerCase()),
    );

    // 2. Group versions by datasetId
    const groupedDatasets = Object.values(
        filteredItems.reduce((acc: Record<string, any[]>, dataset: any) => {
            const id = dataset.datasetId;
            if (!acc[id]) acc[id] = [];
            acc[id].push(dataset);
            return acc;
        }, {}),
    );

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-row justify-between items-center">
                <Link to="/dataset/new" className="contents">
                    <PktsButton variant="secondary" className="w-fit" append={<Plus />}>
                        Create New Dataset
                    </PktsButton>
                </Link>
                <PktsInputText
                    className="w-64"
                    placeholder="Filter by name..."
                    value={filterText}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFilterText(e.target.value || "")
                    }
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                {loading ? (
                    <div className="col-span-2 mx-auto py-8">
                        <PktsSpinner />
                    </div>
                ) : groupedDatasets.length > 0 ? (
                    groupedDatasets.map((versions: any[]) => {
                        const primary = versions[0]; // Reference the first item for top-level details

                        return (
                            <Card key={primary.datasetId} className="flex flex-col gap-2">
                                <div className="text-xl font-bold flex gap-2">
                                    <Star
                                        className={`cursor-pointer stroke-light-primary ${favorites?.datasets?.includes(primary.datasetId) ? "fill-light-primary" : ""}`}
                                        onClick={() =>
                                            markFavorite(
                                                userDataController,
                                                favorites,
                                                "datasets",
                                                primary.datasetId,
                                            )
                                        }
                                    />

                                    <Link
                                        className="text-nowrap overflow-hidden text-truncate"
                                        to={`/dataset/${primary.datasetId}`}
                                    >
                                        {primary.name}
                                    </Link>
                                </div>

                                <PktsInputRow label="Versions" className="flex-1">
                                    <PktsInputSelect
                                        name={`versions-${primary.datasetId}`}
                                        placeholder="Select version"
                                        value={primary.version}
                                    >
                                        {versions.map((v: any) => (
                                            <PktsInputOption
                                                key={`${v.datasetId}-${v.version}`}
                                                value={v.version}
                                            >
                                                {`Version ${v.version} (${v.lastUpdatedBy})`}
                                            </PktsInputOption>
                                        ))}
                                    </PktsInputSelect>
                                </PktsInputRow>

                                <div className="flex flex-col italic text-esnetblack-500">
                                    <span>
                                        Last Updated:{" "}
                                        {new Date(primary.lastUpdatedOn).toLocaleString()}
                                    </span>
                                    <span>Last Updated By: {primary.lastUpdatedBy}</span>
                                </div>
                            </Card>
                        );
                    })
                ) : (
                    <div className="col-span-2 text-center py-12 text-esnetblack-500">
                        <h4>No datasets found.</h4>
                    </div>
                )}
            </div>
        </div>
    );
}
