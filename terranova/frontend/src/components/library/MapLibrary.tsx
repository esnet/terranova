import React, { useEffect, useState, useContext } from "react";
import { API_URL } from "../../../static/settings";
import { InputCopy } from "../InputCopy";
import { DataController, setAuthHeaders } from "../../DataController";
import { DataControllerType, DataControllerContextType } from "../../types/mapeditor";
import { Favorites } from "../../context/FavoritesContextProvider";
import { UserDataController } from "../../context/UserDataContextProvider";
import { GlobalLastEditedRefresh } from "../../context/GlobalLastEditedContextProvider";
import { markFavorite } from "./utils";
import Card from "../Card";
import { PktsInputRow, PktsInputText, PktsButton, PktsIconButton, PktsSpinner } from "@esnet/packets-ui-react";
import { Plus, Star, Trash2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { ModalDialog } from "../ModalDialog";

export function MapLibrary() {
    const [mapList, setMapList] = useState([]);
    const [filterText, setFilterText] = useState("");
    const [loading, setLoading] = useState(true);
    const [mapToDelete, setMapToDelete] = useState<any>(null);

    const favorites = useContext(Favorites);
    const { controller: userDataController, instance: userdata } = useContext(
        UserDataController,
    ) as DataControllerContextType;
    const refreshGlobal = useContext(GlobalLastEditedRefresh);

    const fieldsetString =
        "?fields=mapId&fields=name&fields=version" +
        "&fields=lastUpdatedBy&fields=lastUpdatedOn&version=all";

    const [controller] = useState<DataControllerType>(
        new DataController(API_URL + "/maps/" + fieldsetString, mapList, setMapList) as any,
    );

    useEffect(() => {
        const fetchMaps = async () => {
            setLoading(true);
            await controller.fetch();
            setLoading(false);
        };
        fetchMaps();
    }, []);

    // 1. Filter items by text
    const filteredItems = mapList.filter((item: any) =>
        item.name?.toLowerCase().includes(filterText.toLowerCase()),
    );

    // 2. Deduplicate / Group unique maps by ID
    const uniqueMaps = Object.values(
        filteredItems.reduce((acc: Record<string, any>, map: any) => {
            if (!acc[map.mapId]) acc[map.mapId] = map;
            return acc;
        }, {}),
    );

    async function handleDeleteMap() {
        if (!mapToDelete) return;
        const headers = setAuthHeaders({ "Content-Type": "application/json" });
        await fetch(`${API_URL}/map/id/${mapToDelete.mapId}/`, { headers, method: "DELETE" });
        // Clear both sidebar caches so deleted item disappears immediately
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key?.startsWith("lastEdited.") || key?.startsWith("globalLastEdited.")) {
                localStorage.removeItem(key);
            }
        }
        setMapToDelete(null);
        await controller.fetch();
        await userDataController.fetch();
        refreshGlobal?.();
    }

    const deleteModal = mapToDelete && (
        <ModalDialog
            visible={!!mapToDelete}
            setVisible={(v) => { if (!v) setMapToDelete(null); }}
            header="Delete Map"
            footer={
                <div className="flex justify-end gap-2 w-full">
                    <PktsButton variant="secondary" onClick={() => setMapToDelete(null)}>
                        <span className="flex items-center gap-2"><X /> Cancel</span>
                    </PktsButton>
                    <PktsButton variant="destructive" onClick={handleDeleteMap}>
                        <span className="flex items-center gap-2"><Trash2 /> Delete Forever</span>
                    </PktsButton>
                </div>
            }
        >
            <h4>Delete Map</h4>
            <div className="mb-12">Map '{mapToDelete.name}' and all its versions will be permanently deleted.</div>
        </ModalDialog>
    );

    return (
        <div className="flex flex-col gap-4">
        {deleteModal}
            <div className="flex flex-row justify-between items-center">
                <Link to="/map/new" className="contents">
                    <PktsButton variant="secondary" className="w-fit" append={<Plus />}>
                        Create New Map
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

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-2 mx-auto py-8">
                        <PktsSpinner />
                    </div>
                ) : uniqueMaps.length > 0 ? (
                    uniqueMaps.map((map: any) => (
                        <Card key={map.mapId} className="flex flex-col gap-2">
                            <div className="text-xl font-bold flex gap-2 items-center justify-between">
                                <div className="flex gap-2 items-center min-w-0">
                                    <Star
                                        className={`cursor-pointer stroke-light-primary flex-shrink-0 ${userdata?.favorites?.maps?.includes(map.mapId) ? "fill-light-primary" : ""}`}
                                        onClick={() =>
                                            markFavorite(
                                                userDataController,
                                                favorites,
                                                "maps",
                                                map.mapId,
                                            )
                                        }
                                    />
                                    <Link
                                        className="text-nowrap overflow-hidden text-truncate"
                                        to={`/map/${map.mapId}`}
                                    >
                                        {map.name}
                                    </Link>
                                </div>
                                <PktsIconButton
                                    variant="tertiary"
                                    onClick={() => setMapToDelete(map)}
                                    title="Delete map"
                                    className="tn-hover-destructive"
                                >
                                    <Trash2 />
                                </PktsIconButton>
                            </div>
                            <PktsInputRow label="URL">
                                <InputCopy defaultValue={`${API_URL}/output/map/${map.mapId}`} />
                            </PktsInputRow>
                            <div className="flex flex-col italic text-esnetblack-500">
                                <span>
                                    Last Updated: {new Date(map.lastUpdatedOn).toLocaleString()}
                                </span>
                                <span>Last Updated By: {map.lastUpdatedBy}</span>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-2 text-center py-12 text-esnetblack-500">
                        <h4>No maps found.</h4>
                    </div>
                )}
            </div>
        </div>
    );
}
