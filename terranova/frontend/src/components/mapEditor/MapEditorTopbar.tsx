import { Map, Pencil, Save } from "lucide-react";
import React, { useContext, useState } from "react";
import { DataControllerContextType } from "../../types/mapeditor";
import { MapController } from "../../pages/MapEditor.page";
import { ESButton, ESIconButton, ESInputText } from "@esnet/packets-ui";

type MapEditorTopbarProps = {
    saveMapConfig: () => void;
    loading: boolean;
};

const MapEditorTopbar = ({ loading, saveMapConfig }: MapEditorTopbarProps) => {
    const { controller: mapController, instance: mapInstance } = useContext(
        MapController,
    ) as DataControllerContextType;

    const { name: mapName } = mapInstance;

    const [editingName, setEditingName] = useState(false);
    const nameFormSubmit = (e: any) => {
        e.preventDefault();
        mapController.setProperty("name", e.target.elements["map-name"].value);
        setEditingName(false);
    };

    return (
        <div className="sticky top-0 shadow-md z-601 w-full">
            {/* hide anything above the sticky topbar */}
            <div className="h-4 bg-light-background" />
            <div className="w-full flex justify-between py-2 px-4 bg-light-secondary text-white overflow-hidden">
                <div className="flex gap-2 items-center justify-center">
                    <Map />
                    <b>Editing: </b>
                    {!editingName ? (
                        <>
                            <span className="text-nowrap font-bold">{mapInstance.name}</span>
                            <Pencil
                                className="cursor-pointer"
                                onClick={() => setEditingName(true)}
                            />
                        </>
                    ) : (
                        <form onSubmit={nameFormSubmit} className="flex gap-x-2 items-center">
                            <div className="w-full">
                                <ESInputText name="map-name" defaultValue={mapName} />
                            </div>
                            <button className="contents">
                                <Save className="cursor-pointer" />
                            </button>
                        </form>
                    )}
                </div>

                <div className="hidden lg:flex gap-2">
                    <ESButton
                        variant="destructive"
                        disabled={loading}
                        className="hidden md:auto"
                        onClick={() => window.location.reload()}
                    >
                        Discard Changes
                    </ESButton>
                    <ESButton disabled={loading} className="hidden md:auto" onClick={saveMapConfig}>
                        Save Changes
                    </ESButton>
                </div>
                <div className="flex lg:hidden gap-2">
                    <ESIconButton
                        variant="destructive"
                        name="trash"
                        disabled={loading}
                        className="block md:hidden"
                        onClick={() => window.location.reload()}
                    />
                    <ESIconButton
                        variant="primary"
                        name="save"
                        disabled={loading}
                        className="block md:hidden"
                        onClick={saveMapConfig}
                    />
                </div>
            </div>
        </div>
    );
};

export default MapEditorTopbar;
