import { API_URL, PUBLISH_SCOPE } from "../../../static/settings";
import React, { useState, useContext, useEffect } from "react";
import { MapController } from "../../pages/MapEditor.page";
import { DataControllerContextType } from "../../types/mapeditor";
import { resolvePath, setPath } from "../../data/utils";
import { DEFAULT_MAP } from "../../data/constants";
import { InputRange } from "../InputRange";
import { signals } from "esnet-networkmap-panel";
import { ClipboardCopyInput } from "../ClipboardCopyInput.component";
import { MapOutputModalDialog } from "./MapOutputModalDialog.component";
import { MapPublishModalDialog } from "./MapPublishModalDialog.component";
import { useAuth } from "../../AuthService";
import { Icon } from "../Icon.component";

// TODO: This will be imported through engagemap
import { MapBackgrounds, ViewStrategies, BaseTilesets } from "./MapEditor.constants";
import {
    ESButton,
    ESDivider,
    ESInputNumber,
    ESInputOption,
    ESInputRow,
    ESInputSelect,
} from "@esnet/packets-ui";
import { ArrowUpToLine } from "lucide-react";
import InputColor from "../InputColor";

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
                <ESButton variant="secondary" onClick={() => setShowPublishModal(true)}>
                    <span className="flex items-center">
                        <ArrowUpToLine />
                        &nbsp;Publish Map
                    </span>
                </ESButton>
            )}
            <ESButton variant="secondary" onClick={() => setShowModal(true)}>
                Get Map Output
            </ESButton>
            <div className="text-center">Current Version: {controller?.instance?.version}</div>
            <ESDivider />
            <ESInputRow label="Background">
                <ESInputSelect
                    name="map-background"
                    onChange={handleMapBackgroundChange}
                    value={mapBackground}
                >
                    {MapBackgrounds.map((d) => {
                        return (
                            <ESInputOption value={d.value} key={`map-background-option-${d.value}`}>
                                {d.label}
                            </ESInputOption>
                        );
                    })}
                </ESInputSelect>
            </ESInputRow>

            {mapBackground === "tiles" ? (
                <ESInputRow label="Geographic Tileset">
                    <ESInputSelect
                        name="map-background-tiles"
                        onChange={(e) =>
                            handleConfigChange("tileset.geographic", e.target.value, BaseTilesets)
                        }
                        value={controller?.instance?.configuration?.tileset?.geographic ?? "arcgis"}
                    >
                        {BaseTilesets.map((d) => {
                            const value = d.value ?? d.label;
                            return (
                                <ESInputOption value={value} key={`map-background-option-${value}`}>
                                    {d.label}
                                </ESInputOption>
                            );
                        })}
                    </ESInputSelect>
                </ESInputRow>
            ) : (
                <ESInputRow label="Background Color">
                    <InputColor
                        name="map-background-color"
                        onChange={(e) => handleConfigChange("background", e.target.value, null)}
                        value={instance.configuration.background}
                    />
                </ESInputRow>
            )}

            <ESInputRow label="Map Initial Position">
                <ESInputSelect
                    name="map-background-tiles"
                    onChange={(e) =>
                        handleConfigChange("initialViewStrategy", e.target.value, ViewStrategies)
                    }
                    value={controller?.instance?.configuration?.initialViewStrategy}
                >
                    {ViewStrategies.map((d) => {
                        return (
                            <ESInputOption
                                role="option"
                                value={d.value}
                                key={`map-background-option-${d.value}`}
                            >
                                {d.label}
                            </ESInputOption>
                        );
                    })}
                </ESInputSelect>
            </ESInputRow>

            {instance.configuration.initialViewStrategy === "viewport" ? (
                <div key={instance.configuration?.viewport}>
                    <button
                        className="w-full secondary mt-2"
                        onClick={(e) => {
                            props.mapCanvasRef.current.emit(signals.REQUEST_VIEWPORT);
                        }}
                    >
                        Set Viewport from Map State
                    </button>
                    <div className="flex flex-wrap items-stretch">
                        <div className="w-6/12 pr-1">
                            <fieldset className="flex flex-wrap items-stretch">
                                <legend className="text-sm">Top-left</legend>
                                <div className="w-6/12 pr-2 -mt-3">
                                    <label htmlFor="viewport.top">Latitude</label>
                                    <div key={`vpt-${instance.configuration?.viewport?.top}`}>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="viewport.top"
                                            className="w-full"
                                            onChange={(e) =>
                                                handleConfigChange(
                                                    "viewport.top",
                                                    e.target.valueAsNumber,
                                                    null,
                                                )
                                            }
                                            defaultValue={instance.configuration?.viewport?.top}
                                        />
                                    </div>
                                </div>
                                <div className="w-6/12 pl-2 -mt-3">
                                    <label htmlFor="viewport.left">Longitude</label>
                                    <div key={`vpl-${instance.configuration?.viewport?.left}`}>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="viewport.left"
                                            className="w-full"
                                            onChange={(e) =>
                                                handleConfigChange(
                                                    "viewport.left",
                                                    e.target.valueAsNumber,
                                                    null,
                                                )
                                            }
                                            defaultValue={instance.configuration?.viewport?.left}
                                        />
                                    </div>
                                </div>
                            </fieldset>
                        </div>
                        <div className="w-6/12 pl-1">
                            <fieldset className="flex flex-wrap items-stretch">
                                <legend className="text-sm">Bottom-Right</legend>
                                <div className="w-6/12 pr-2 -mt-3">
                                    <label htmlFor="viewport.bottom">Latitude</label>
                                    <div key={`vpb-${instance.configuration?.viewport?.bottom}`}>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="viewport.bottom"
                                            className="w-full"
                                            onChange={(e) =>
                                                handleConfigChange(
                                                    "viewport.bottom",
                                                    e.target.valueAsNumber,
                                                    null,
                                                )
                                            }
                                            defaultValue={instance.configuration?.viewport?.bottom}
                                        />
                                    </div>
                                </div>
                                <div className="w-6/12 pl-2 -mt-3">
                                    <label htmlFor="viewport.right">Longitude</label>
                                    <div key={`vpr-${instance.configuration?.viewport?.right}`}>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="viewport.right"
                                            className="w-full"
                                            onChange={(e) =>
                                                handleConfigChange(
                                                    "viewport.right",
                                                    e.target.valueAsNumber,
                                                    null,
                                                )
                                            }
                                            defaultValue={instance.configuration?.viewport?.right}
                                        />
                                    </div>
                                </div>
                            </fieldset>
                        </div>
                    </div>
                </div>
            ) : (
                <></>
            )}

            {instance.configuration.initialViewStrategy === "static" && (
                <>
                    <ESButton
                        onClick={() =>
                            props.mapCanvasRef.current.emit(signals.REQUEST_MAP_CENTER_AND_ZOOM)
                        }
                        variant="secondary"
                    >
                        Set Center & Zoom From Map State
                    </ESButton>
                    <div className="flex gap-2">
                        <ESInputRow
                            label="Starting Latitude"
                            // force a rerender on lat center change (can't occur since it's not a state)
                            key={`slat-${instance.configuration?.viewport?.center?.lat}`}
                        >
                            <ESInputNumber
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
                        </ESInputRow>
                        <ESInputRow
                            label="Starting Longitude"
                            // force a rerender on lng center change (can't occur since it's not a state)
                            key={`slng-${instance.configuration?.viewport?.center?.lng}`}
                        >
                            <ESInputNumber
                                type="number"
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
                        </ESInputRow>
                    </div>
                    <ESInputRow
                        label="Start Zoom"
                        // force a rerender on lng center change (can't occur since it's not a state)
                        key={`szoom-${rerenderViewportZoom}`}
                    >
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
                    </ESInputRow>
                </>
            )}

            {instance.configuration.initialViewStrategy === "variables" ? (
                <div key={instance.configuration?.viewport}>
                    <label htmlFor="start-lat">Latitude Variable</label>
                    <div>
                        <input
                            type="text"
                            name="latitudeVar"
                            onChange={(e) =>
                                handleConfigChange("latitudeVar", e.target.value, null)
                            }
                            defaultValue={instance.configuration?.latitudeVar}
                        />
                    </div>

                    <label htmlFor="start-lng">Longitude Variable</label>
                    <div>
                        <input
                            type="text"
                            name="longitudeVar"
                            onChange={(e) =>
                                handleConfigChange("longitudeVar", e.target.value, null)
                            }
                            defaultValue={instance.configuration?.longitudeVar}
                        />
                    </div>

                    <label htmlFor="start-zoom">Initial Zoom</label>
                    <div>
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
                    </div>
                </div>
            ) : (
                <div />
            )}
        </div>
    );
};
