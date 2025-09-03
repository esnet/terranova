import { useState, useEffect } from "react";
import { OUTPUT_OPTIONS, OUTPUT_INSTRUCTIONS } from "../../data/constants";
import { API_URL } from "../../../static/settings";
import { ModalDialog } from "../ModalDialog.component";
import { setAuthHeaders } from "../../DataController";
import { Icon } from "../Icon.component";

interface MapOutputModalDialogProps {
    map: any;
    visible: boolean;
    dismiss: any;
}

export const MapOutputModalDialog = (props: MapOutputModalDialogProps) => {
    let header = "Map Output";
    let footer = (
        <>
            <span></span>
            <div
                className="compound hover:bg-mauve-200 cursor-pointer rounded-lg"
                onClick={props.dismiss}
            >
                <Icon name="check-square" className="icon btn small p-1 stroke-esnetblack-700" />
                <div className="py-1 pr-3 text-esnetblack-700">Done</div>
            </div>
        </>
    );
    let [selectedOption, setSelectedOption] = useState(OUTPUT_OPTIONS[0].value);
    let [svgOutput, setSvgOutput] = useState<string | null | undefined>("");
    let [svgObjectUrl, setSvgObjectUrl] = useState<string | undefined>("");

    const renderOutput = (option: string) => {
        switch (option) {
            case "grafana":
                return `${API_URL}/public/output/map/${props.map.mapId}/`;
            case "svg":
                return `${API_URL}/output/map/${props.map.mapId}/svg/`;
            case "html-svg":
                return `<img src='${API_URL}/output/map/${props.map.mapId}/svg/' />`;
            case "iframe":
                return `<iframe src="${API_URL}/output/map/${props.map.mapId}/iframe/" />`;
            case "html-script":
                return `<script src="${API_URL}/output/map/${props.map.mapId}/javascript/"></script>
<script>
document.appendChild(terranova.maps["${props.map.mapId}"]);
</script>`;
            case "html-component":
                return `<script src="${API_URL}/output/bootstrap/"></script>
<esnet-networkmap-panel configuration="${API_URL}/output/map/${props.map.mapId}/json/" />`;
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
        }
    };

    const fetchSvg = async () => {
        let headers = {
            "Content-type": "application/json",
        } as any;
        headers = setAuthHeaders(headers);
        let output = null;
        try {
            let response = await fetch(`${API_URL}/output/map/${props.map.mapId}/svg/`, {
                headers: headers,
            });
            if (response.ok) {
                output = await response.text();
            }
        } catch {
            console.error("Error fetching SVG for map");
        }
        let objectUrl = window.URL.createObjectURL(new Blob([output as BlobPart]));
        setSvgObjectUrl(objectUrl);
        setSvgOutput(output);
    };

    useEffect(() => {
        if (selectedOption == "svg") {
            fetchSvg();
        }
    }, [selectedOption]);

    useEffect(() => {
        setSelectedOption("grafana");
        setSvgOutput("");
    }, [props.visible]);

    const renderPreview = (option: string) => {
        switch (option) {
            case "grafana":
            case "html-svg":
            case "html-script":
            case "html-component":
            case "react":
            case "web-component":
                return (
                    <div>
                        <textarea className="output-preview" defaultValue={renderOutput(option)} />
                        <button className="secondary">Copy to Clipboard</button>
                    </div>
                );
            case "iframe":
                return (
                    <div>
                        <textarea className="output-preview" defaultValue={renderOutput(option)} />
                        <button className="secondary mr-2">Copy to Clipboard</button>
                        <button className="primary">Preview</button>
                    </div>
                );
            case "svg":
                return (
                    <div>
                        <p className="text-black my-2">SVG Output</p>
                        <div
                            className="svg-target h-48 my-2"
                            dangerouslySetInnerHTML={{ __html: `${svgOutput}` }}
                        />
                        <button className="secondary mr-2">Copy to Clipboard</button>
                        <a
                            key={`svgo-${svgObjectUrl}`}
                            href={svgObjectUrl}
                            className="btn primary text-esnetblack-400 hover:text-white focus:text-esnetblack-400"
                            download="Map_Output.svg"
                        >
                            Download
                        </a>
                    </div>
                );
        }
    };

    if (!props.map.mapId) {
        return (
            <ModalDialog
                header={header}
                footer={footer}
                visible={props.visible}
                dismiss={props.dismiss}
            >
                <h5>This map has not yet been saved.</h5>
                <p>To get API map output, you must first save your map.</p>
            </ModalDialog>
        );
    }
    return (
        <ModalDialog
            visible={props.visible}
            dismiss={props.dismiss}
            header={header}
            footer={footer}
        >
            <div className="flex flex-row">
                <fieldset className="w-5/12 mr-2">
                    <p className="tn-bold my-2 text-black">Intended Output</p>
                    <select
                        value={selectedOption}
                        onChange={(e) => {
                            setSelectedOption(e.target.value);
                        }}
                    >
                        {OUTPUT_OPTIONS.map((opt) => {
                            return <option value={opt.value}>{opt.label}</option>;
                        })}
                    </select>
                    <p className="my-2 tn-bold text-black">Instructions</p>
                    <p>{OUTPUT_INSTRUCTIONS[selectedOption]}</p>
                </fieldset>
                <fieldset className="w-6/12" key={selectedOption}>
                    {renderPreview(selectedOption)}
                </fieldset>
            </div>
        </ModalDialog>
    );
};
