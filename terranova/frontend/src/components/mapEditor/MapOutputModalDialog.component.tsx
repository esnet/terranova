import { useState, useEffect } from "react";
import { OUTPUT_OPTIONS, OUTPUT_INSTRUCTIONS } from "../../data/constants";
import { API_URL } from "../../../static/settings";
import { setAuthHeaders } from "../../DataController";
import { ModalDialog } from "../ModalDialog";
import {
    PktsButton,
    PktsInputRow,
    PktsInputSelect,
    PktsInputOption,
} from "@esnet/packets-ui-react";

const renderOutput = (option: string, mapId: string) => {
    switch (option) {
        case "grafana":
            return `${API_URL}/public/output/map/${mapId}/`;
        case "svg":
            return `${API_URL}/output/map/${mapId}/svg/`;
        case "html-svg":
            return `<img src='${API_URL}/output/map/${mapId}/svg/' />`;
        case "iframe":
            return `<iframe src="${API_URL}/output/map/${mapId}/iframe/" />`;
        case "html-script":
            return `<script src="${API_URL}/output/map/${mapId}/javascript/"></script>
<script>
document.appendChild(terranova.maps["${mapId}"]);
</script>`;
        case "html-component":
            return `<script src="${API_URL}/output/bootstrap/"></script>
<esnet-networkmap-panel configuration="${API_URL}/output/map/${mapId}/json/" />`;
        case "react":
            return `import { NetworkMapPanel } from "esnet-networkmap-panel";

function ExampleWrapperComponent(){
    return <NetworkMapPanel configuration="${API_URL}">
}`;
        case "web-component":
            return `import "esnet-networkmap-panel";

let elem = document.createElement("esnet-networkmap-panel");
elem.setProperty("configuration", "${API_URL}")

// you'll probably want to append this to a target element instead
document.appendChild(elem);`;
            break;
        default:
            return "Unknown option. Plase select another.";
    }
};

const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
};

interface MapOutputModalDialogProps {
    map: any;
    visible: boolean;
    dismiss: any;
}

export const MapOutputModalDialog = (props: MapOutputModalDialogProps) => {
    const [selectedOption, setSelectedOption] = useState(OUTPUT_OPTIONS[0].value);
    const [svgOutput, setSvgOutput] = useState<string | null | undefined>(undefined);

    const fetchSvg = async () => {
        const headers = setAuthHeaders({
            "Content-type": "application/json",
        });
        try {
            const response = await fetch(`${API_URL}/output/map/${props.map.mapId}/svg/`, {
                headers: headers,
            });
            const output = await response.text();
            let objectUrl = window.URL.createObjectURL(new Blob([output as BlobPart]));
            setSvgOutput(output);
        } catch {
            console.error("Error fetching SVG for map");
            setSvgOutput(null);
        }
    };

    const output = renderOutput(selectedOption, props.map.mapId);

    // only fetch svg when requested
    useEffect(() => {
        if (selectedOption == "svg") {
            fetchSvg();
        }
    }, [selectedOption]);

    // reset selected output option and rendered svg
    useEffect(() => {
        setSelectedOption(OUTPUT_OPTIONS[0].value);
        setSvgOutput(undefined);
    }, [props.visible]);

    const renderPreview = (option: string) => {
        switch (option) {
            case "grafana":
            case "html-svg":
                return (
                    <>
                        <p className="text-text-wrap break-all min-h-32 p-2 monospace rounded-lg bg-light-surface_1">
                            {output}
                        </p>
                        <PktsButton variant="secondary" onClick={() => copyToClipboard(output)}>
                            Copy to Clipboard
                        </PktsButton>
                    </>
                );
            case "svg":
                return (
                    <>
                        {svgOutput !== null ? (
                            <div
                                className="svg-target h-48 p-2"
                                dangerouslySetInnerHTML={{ __html: `${svgOutput ?? "Loading..."}` }}
                            />
                        ) : (
                            <span className="text-light-error">
                                Error fetching SVG output. Check to see if your map is published.
                            </span>
                        )}
                        <div className="flex flex-col gap-2">
                            <PktsButton variant="secondary">Copy to Clipboard</PktsButton>
                            <PktsButton
                                variant="secondary"
                                as="a"
                                download={`${props.map.name}.svg`}
                                href={window.URL.createObjectURL(new Blob([svgOutput as BlobPart]))}
                            >
                                Download
                            </PktsButton>
                        </div>
                    </>
                );

            case "html-script":
            case "html-component":
            case "react":
            case "web-component":
            case "iframe":
                return <span>Not yet supported.</span>;
        }
    };

    return (
        <ModalDialog
            className="flex gap-x-4"
            visible={props.visible}
            setVisible={() => props.dismiss()}
            header={"Map Output"}
        >
            <div className="w-1/2 flex flex-col gap-4">
                <PktsInputRow label="Output Format">
                    <PktsInputSelect
                        value={selectedOption}
                        onChange={(e) => {
                            setSelectedOption(e.target.value);
                        }}
                        name="output-format"
                    >
                        {OUTPUT_OPTIONS.map((opt) => {
                            return <PktsInputOption value={opt.value}>{opt.label}</PktsInputOption>;
                        })}
                    </PktsInputSelect>
                </PktsInputRow>
                <p className="m-0">
                    <b className="block mb-1 tn-bold text-black">Instructions</b>
                    {OUTPUT_INSTRUCTIONS[selectedOption]}
                </p>
            </div>
            <div className="w-1/2 flex flex-col gap-2 justify-between">
                {renderPreview(selectedOption)}
            </div>
        </ModalDialog>
    );
};
