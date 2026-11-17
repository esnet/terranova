import { Map, Pencil, Save, Trash, History } from "lucide-react";
import React, { useContext, useState } from "react";
import { DataControllerContextType } from "../../types/mapeditor";
import { MapController } from "../../pages/MapEditor.page";
import { PktsInputText, PktsButton, PktsIconButton } from "@esnet/packets-ui-react";

type MapEditorTopbarProps = {
    saveMapConfig: () => void;
    loading: boolean;
    onToggleHistory?: () => void;
    historyOpen?: boolean;
};

const MapEditorTopbar = ({ loading, saveMapConfig, onToggleHistory, historyOpen }: MapEditorTopbarProps) => {
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
                <div className="flex gap-2 items-center justify-center text-lg">
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
                                <PktsInputText name="map-name" defaultValue={mapName} />
                            </div>
                            <button className="contents">
                                <Save className="cursor-pointer" />
                            </button>
                        </form>
                    )}
                </div>

                <div className="hidden lg:flex w-fit gap-2 items-center">
                    {onToggleHistory && (
                        <PktsButton
                            variant={historyOpen ? "secondary" : "tertiary"}
                            disabled={loading}
                            onClick={onToggleHistory}
                            className="flex items-center gap-1"
                        >
                            <History size={14} /> History
                        </PktsButton>
                    )}
                    <PktsButton
                        variant="destructive"
                        disabled={loading}
                        className=""
                        onClick={() => window.location.reload()}
                    >
                        Discard Changes
                    </PktsButton>
                    <PktsButton
                        variant="primary"
                        disabled={loading}
                        className=""
                        onClick={saveMapConfig}
                    >
                        Save Changes
                    </PktsButton>
                </div>
                <div className="flex lg:hidden gap-2">
                    {onToggleHistory && (
                        <PktsIconButton
                            variant={historyOpen ? "secondary" : "tertiary"}
                            disabled={loading}
                            onClick={onToggleHistory}
                        >
                            <History />
                        </PktsIconButton>
                    )}
                    <PktsIconButton
                        variant="destructive"
                        disabled={loading}
                        className="block"
                        onClick={() => window.location.reload()}
                    >
                        <Trash />
                    </PktsIconButton>
                    <PktsIconButton
                        variant="primary"
                        disabled={loading}
                        className="block"
                        onClick={saveMapConfig}
                    >
                        <Save />
                    </PktsIconButton>
                </div>
            </div>
        </div>
    );
};

export default MapEditorTopbar;
