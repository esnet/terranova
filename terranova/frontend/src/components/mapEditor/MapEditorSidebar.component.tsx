import { API_URL, PUBLISH_SCOPE } from "../../../static/settings";
import React, { useState, useContext, useEffect } from "react";
import { MapController } from "../../pages/MapEditor.page";
import { DataControllerContextType } from "../../types/mapeditor";
import { DEFAULT_MAP } from "../../data/constants";
import { InputRange } from "../InputRange";
import { signals } from "esnet-networkmap-panel";
import { MapOutputModalDialog } from "./MapOutputModalDialog.component";
import { MapPublishModalDialog } from "./MapPublishModalDialog.component";
import { useAuth } from "../../AuthService";
// TODO: This will be imported through engagemap
import { MapBackgrounds, ViewStrategies, BaseTilesets } from "./MapEditor.constants";
import { ArrowUpToLine } from "lucide-react";
import InputColor from "../InputColor";
import {
    PktsButton,
    PktsDivider,
    PktsInputRow,
    PktsInputSelect,
    PktsInputOption,
    PktsInputNumber,
    PktsInputText,
} from "@esnet/packets-ui-react";

/**
 * TODO: map publish functionality
 * TODO: get map output functionality
 * overall testing
 */
export const MapEditorSidebar = (props: any) => {
    let showPublishButton = false;
    let auth = useAuth();
    if (auth?.user?.scope && auth.user.scope.indexOf(PUBLISH_SCOPE) >= 0) {
        showPublishButton = true;
    }

    // use the imported MapInstance to bootstrap the Context
    const { controller, instance } = useContext(MapController) as DataControllerContextType;

    const [showModal, setShowModal] = useState(false);
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [subscribed, setSubscribed] = useState(false);
    const [rerenderViewportZoom, setRerenderViewportZoom] = useState(0.0);

    const [mapBackground, setMapBackground] = useState("tiles");
    const [lastTileset, setLastTileset] = useState(instance.configuration.tileset);
    const handleMapBackgroundChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setMapBackground(event.target.value);
        if (event.target.value == "solid") {
            setLastTileset({ ...instance.configuration.tileset });
            handleConfigChange("tileset.geographic", null);
            handleConfigChange("tileset.political", null);
            handleConfigChange("tileset.boundaries", null);
        } else {
            if (lastTileset) {
                handleConfigChange(
                    "tileset.geographic",
                    lastTileset.geographic || (DEFAULT_MAP as any).configuration.tileset.geographic,
                );
                handleConfigChange("tileset.political", lastTileset.political);
                handleConfigChange("tileset.boundaries", lastTileset.boundaries);
            } else {
                handleConfigChange(
                    "tileset.geographic",
                    (DEFAULT_MAP as any).configuration.tileset.geographic,
                );
                handleConfigChange(
                    "tileset.political",
                    (DEFAULT_MAP as any).configuration.tileset.political,
                );
                handleConfigChange(
                    "tileset.boundaries",
                    (DEFAULT_MAP as any).configuration.tileset.boundaries,
                );
            }
        }
    };

    useEffect(() => {
        let newVal = instance?.configuration?.tileset?.geographic ? "tiles" : "solid";
        setMapBackground(newVal);
    }, [instance.configuration]);

    const findMatch = (
        value: string | number,
        availableValues: Array<{ value: string | null; label: string }>,
    ) => {
        let match = availableValues.find((o) => o.value === value);
        if (match === undefined) {
            return null;
        } else {
            return match.value;
        }
    };

    useEffect(() => {
        if (props.mapCanvasRef.current && !subscribed) {
            props.mapCanvasRef.current.listen(signals.RETURN_VIEWPORT, (coords: any) => {
                handleConfigChange("viewport.top", coords.coordinates.getNorth().toFixed(3));
                handleConfigChange("viewport.left", coords.coordinates.getWest().toFixed(3));
                handleConfigChange("viewport.bottom", coords.coordinates.getSouth().toFixed(3));
                handleConfigChange("viewport.right", coords.coordinates.getEast().toFixed(3));
            });
            props.mapCanvasRef.current.listen(
                signals.RETURN_MAP_CENTER_AND_ZOOM,
                (centerAndZoom: any) => {
                    handleConfigChange("viewport.center.lat", centerAndZoom.center.lat.toFixed(3));
                    handleConfigChange("viewport.center.lng", centerAndZoom.center.lng.toFixed(3));
                    handleConfigChange("viewport.zoom", centerAndZoom.zoom);
                    setRerenderViewportZoom(Math.random());
                },
            );
            setSubscribed(true);
        }
    }, [props.mapCanvasRef.current]);

    const handleConfigChange = (
        property: string,
        value: any,
        availableValues: Array<{ value: string | null; label: string }> | null = null,
    ) => {
        let newValue: string | null | number = value;
        if (availableValues !== null) {
            newValue = findMatch(value, availableValues);
        }
        controller.setProperty(`configuration.${property}`, newValue);
        let editMode = props.mapCanvasRef.current.lastValue(signals.EDITING_SET);
        let opts = JSON.parse(JSON.stringify(instance.configuration));
        opts.enableEditing = true;
        opts.topologySource = "json";
        props.mapCanvasRef.current.setOptions(opts);
        props.mapCanvasRef.current.setEditMode(editMode);
    };

    const buildMapURL = () => {
        let url: string = `${API_URL}/output/map/${instance.mapId}/?version=latest`;
        return url;
    };

    const handleClipboardCopy = () => {
        navigator.clipboard.writeText(buildMapURL());
    };

    return (
        <div className="min-w-64 w-2/5 2xl:w-1/4 flex flex-col gap-2">
            <MapOutputModalDialog
                map={controller.instance}
                visible={showModal}
                dismiss={() => {
                    setShowModal(false);
                }}
            />
            <MapPublishModalDialog
                map={controller.instance}
                visible={showPublishModal}
                dismiss={() => {
                    setShowPublishModal(false);
                }}
            />
            {showPublishButton && (
                <PktsButton
                    disabled={!instance?.mapId}
                    variant="secondary"
                    onClick={() => setShowPublishModal(true)}
                >
                    <span className="flex items-center">
                        <ArrowUpToLine />
                        &nbsp;Publish Map
                    </span>
                </PktsButton>
            )}
            <PktsButton
                disabled={!instance?.mapId}
                variant="secondary"
                onClick={() => setShowModal(true)}
            >
                Get Map Output
            </PktsButton>
            <div className="text-center">Current Version: {controller?.instance?.version}</div>
            <PktsDivider />
            <PktsInputRow label="Background">
                <PktsInputSelect
                    name="map-background"
                    onChange={handleMapBackgroundChange}
                    value={mapBackground}
                >
                    {MapBackgrounds.map((d) => {
                        return (
                            <PktsInputOption
                                value={d.value}
                                key={`map-background-option-${d.value}`}
                            >
                                {d.label}
                            </PktsInputOption>
                        );
                    })}
                </PktsInputSelect>
            </PktsInputRow>

            {mapBackground === "tiles" ? (
                <PktsInputRow label="Geographic Tileset">
                    <PktsInputSelect
                        name="map-background-tiles"
                        onChange={(e) =>
                            handleConfigChange("tileset.geographic", e.target.value, BaseTilesets)
                        }
                        value={controller?.instance?.configuration?.tileset?.geographic ?? "arcgis"}
                    >
                        {BaseTilesets.map((d) => {
                            const value = d.value ?? d.label;
                            return (
                                <PktsInputOption
                                    value={value}
                                    key={`map-background-option-${value}`}
                                >
                                    {d.label}
                                </PktsInputOption>
                            );
                        })}
                    </PktsInputSelect>
                </PktsInputRow>
            ) : (
                <PktsInputRow label="Background Color">
                    <InputColor
                        name="map-background-color"
                        onChange={(e) => handleConfigChange("background", e.target.value, null)}
                        value={instance.configuration.background}
                    />
                </PktsInputRow>
            )}

            <PktsInputRow label="Map Initial Position">
                <PktsInputSelect
                    name="map-background-tiles"
                    onChange={(e) =>
                        handleConfigChange("initialViewStrategy", e.target.value, ViewStrategies)
                    }
                    value={controller?.instance?.configuration?.initialViewStrategy}
                >
                    {ViewStrategies.map((d) => {
                        return (
                            <PktsInputOption
                                role="option"
                                value={d.value}
                                key={`map-background-option-${d.value}`}
                            >
                                {d.label}
                            </PktsInputOption>
                        );
                    })}
                </PktsInputSelect>
            </PktsInputRow>

            {instance.configuration.initialViewStrategy === "viewport" && (
                <div className="flex flex-col gap-4 mt-2">
                    <PktsButton
                        className="w-full"
                        variant="secondary"
                        onClick={(e) => {
                            props.mapCanvasRef.current.emit(signals.REQUEST_VIEWPORT);
                        }}
                    >
                        Set Viewport from Map State
                    </PktsButton>

                    <div className="flex flex-col gap-2">
                        <div className="flex flex-row gap-4">
                            <div className="flex-1">
                                <PktsInputRow
                                    label="Top-left Lat"
                                    key={`vpt-${instance.configuration?.viewport?.top}`}
                                >
                                    <PktsInputNumber
                                        step="0.01"
                                        name="viewport.top"
                                        onChange={(e) =>
                                            handleConfigChange(
                                                "viewport.top",
                                                e.target.valueAsNumber,
                                                null,
                                            )
                                        }
                                        defaultValue={instance.configuration?.viewport?.top}
                                    />
                                </PktsInputRow>
                            </div>
                            <div className="flex-1">
                                <PktsInputRow
                                    label="Top-left Lng"
                                    key={`vpt-${instance.configuration?.viewport?.left}`}
                                >
                                    <PktsInputNumber
                                        step="0.01"
                                        name="viewport.left"
                                        onChange={(e) =>
                                            handleConfigChange(
                                                "viewport.left",
                                                e.target.valueAsNumber,
                                                null,
                                            )
                                        }
                                        defaultValue={instance.configuration?.viewport?.left}
                                    />
                                </PktsInputRow>
                            </div>
                        </div>

                        <div className="flex flex-row gap-4">
                            <div className="flex-1">
                                <PktsInputRow
                                    label="Bottom-right Lat"
                                    key={`vpt-${instance.configuration?.viewport?.bottom}`}
                                >
                                    <PktsInputNumber
                                        step="0.01"
                                        name="viewport.bottom"
                                        onChange={(e) =>
                                            handleConfigChange(
                                                "viewport.bottom",
                                                e.target.valueAsNumber,
                                                null,
                                            )
                                        }
                                        defaultValue={instance.configuration?.viewport?.bottom}
                                    />
                                </PktsInputRow>
                            </div>
                            <div className="flex-1">
                                <PktsInputRow
                                    label="Bottom-right Lng"
                                    key={`vpt-${instance.configuration?.viewport?.right}`}
                                >
                                    <PktsInputNumber
                                        step="0.01"
                                        name="viewport.right"
                                        onChange={(e) =>
                                            handleConfigChange(
                                                "viewport.right",
                                                e.target.valueAsNumber,
                                                null,
                                            )
                                        }
                                        defaultValue={instance.configuration?.viewport?.right}
                                    />
                                </PktsInputRow>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {instance.configuration.initialViewStrategy === "static" && (
                <div className="flex flex-col gap-2 mt-2">
                    <PktsButton
                        onClick={() =>
                            props.mapCanvasRef.current.emit(signals.REQUEST_MAP_CENTER_AND_ZOOM)
                        }
                        variant="secondary"
                    >
                        Set Center & Zoom From Map State
                    </PktsButton>
                    <div className="flex gap-2">
                        <PktsInputRow
                            label="Starting Latitude"
                            key={`slat-${instance.configuration?.viewport?.center?.lat}`}
                        >
                            <PktsInputNumber
                                step="0.01"
                                name="start-lat"
                                onChange={(e) =>
                                    handleConfigChange(
                                        "viewport.center.lat",
                                        e.target.valueAsNumber,
                                        null,
                                    )
                                }
                                defaultValue={instance.configuration?.viewport?.center?.lat}
                            />
                        </PktsInputRow>
                        <PktsInputRow
                            label="Starting Longitude"
                            key={`slng-${instance.configuration?.viewport?.center?.lng}`}
                        >
                            <PktsInputNumber
                                step="0.01"
                                name="start-lng"
                                onChange={(e) =>
                                    handleConfigChange(
                                        "viewport.center.lng",
                                        e.target.valueAsNumber,
                                        null,
                                    )
                                }
                                defaultValue={instance.configuration?.viewport?.center?.lng}
                            />
                        </PktsInputRow>
                    </div>
                    <PktsInputRow label="Start Zoom" key={`szoom-${rerenderViewportZoom}`}>
                        <InputRange
                            name="viewport.zoom"
                            min="1"
                            max="15"
                            step="0.25"
                            onChange={(e: { target: { valueAsNumber: any } }) =>
                                handleConfigChange("viewport.zoom", e.target.valueAsNumber, null)
                            }
                            defaultValue={instance.configuration?.viewport?.zoom}
                        />
                    </PktsInputRow>
                </div>
            )}

            {instance.configuration.initialViewStrategy === "variables" && (
                <div className="flex flex-col gap-2 mt-2">
                    <PktsInputRow label="Latitude Variable">
                        <PktsInputText
                            name="latitudeVar"
                            onChange={(e) =>
                                handleConfigChange("latitudeVar", e.target.value, null)
                            }
                            defaultValue={instance.configuration?.latitudeVar}
                        />
                    </PktsInputRow>

                    <PktsInputRow label="Longitude Variable">
                        <PktsInputText
                            name="longitudeVar"
                            onChange={(e) =>
                                handleConfigChange("longitudeVar", e.target.value, null)
                            }
                            defaultValue={instance.configuration?.longitudeVar}
                        />
                    </PktsInputRow>

                    <PktsInputRow label="Initial Zoom">
                        <InputRange
                            name="viewport.zoom"
                            min="1"
                            max="15"
                            step="0.25"
                            onChange={(e: { target: { valueAsNumber: any } }) =>
                                handleConfigChange("viewport.zoom", e.target.valueAsNumber, null)
                            }
                            defaultValue={instance.configuration?.viewport?.zoom}
                        />
                    </PktsInputRow>
                </div>
            )}
        </div>
    );
};
