import { useState, useEffect } from "react";
import { API_URL } from "../../../static/settings";
import { ModalDialog } from "../ModalDialog.component";
import { useAuth } from "react-oidc-context";
import { Icon } from "../Icon.component";

interface MapPublishModalDialogProps {
    map: any;
    visible: boolean;
    dismiss: any;
}

export const MapPublishModalDialog = (props: MapPublishModalDialogProps) => {
    let auth = useAuth();
    let [loading, setLoading] = useState<boolean | null>(false);
    let [error, setError] = useState<string | null>("");
    let [state, setState] = useState<string | null>("confirmation");

    useEffect(() => {
        setLoading(false);
        setState("confirmation");
    }, [props.visible]);

    const publishMap = async () => {
        if (loading) {
            return;
        }
        let headers = {
            "Content-type": "application/json",
        } as any;
        if (auth.user) {
            const token = auth.user?.access_token;
            headers["Authorization"] = `Bearer ${token}`;
        }
        let output = null;
        setLoading(true);
        let url = `${API_URL}/map/id/${props.map.mapId}/publish/`;
        try {
            let response = await fetch(url, {
                method: "post",
                headers: headers,
            });
            if (response.ok) {
                output = await response.text();
                setLoading(false);
                setState("success");
            } else {
                setState("error");
                setError(`Error during HTTP POST to to \n${url}`);
            }
        } catch {
            setState("error");
            setError(`Network error during HTTP POST to to \n${url}`);
        }
    };

    let header = (
        <>
            <span>
                <Icon name="alert-triangle" className="inline-block" /> Publish Map
            </span>
        </>
    );
    let footer = (
        <>
            <div className="compound btn cursor-pointer rounded-lg" onClick={props.dismiss}>
                <Icon name="x-square" className="icon btn small p-1 stroke-esnetblack-500" />
                <div className="py-1 pr-3">Cancel</div>
            </div>
            <div
                className="compound hover:bg-mauve-200 btn warning cursor-pointer rounded-lg"
                onClick={publishMap}
            >
                <Icon name="check-square" className="icon btn small p-1 stroke-white" />
                <div className="py-1 pr-3 text-white">Publish</div>
            </div>
        </>
    );
    if (state == "success" || state == "error") {
        footer = (
            <>
                <div
                    className="compound hover:bg-mauve-200 cursor-pointer rounded-lg p-1"
                    onClick={props.dismiss}
                >
                    <Icon name="check-square" />
                    &nbsp;&nbsp;Done
                </div>
            </>
        );
    }

    if (!props.map.mapId) {
        return (
            <ModalDialog
                header={header}
                footer={footer}
                visible={props.visible}
                dismiss={props.dismiss}
                className="w-3/12"
            >
                <h5>This map has not yet been saved.</h5>
                <p>To publish a map, you must first save it.</p>
            </ModalDialog>
        );
    }
    let successMessage = <div className="mr-2 p-6">Map Published.</div>;

    let confirmationMessage = (
        <div className="mr-2 p-6">
            Please confirm that you'd like to publish this map.
            <br />
            <br />
            This action will make:
            <ul className="list-disc ml-6 block">
                <li>the current saved version of the map</li>
                <li>coordinates of all visible objects</li>
                <li>the results of dataset(s) used in the map</li>
            </ul>
            <span className="text-red-500">
                visible to the public internet with no password protection.
            </span>
            <br />
            <br />
            Click <strong className="text-black">Publish</strong> below to proceed, or{" "}
            <strong className="text-black">Cancel</strong> to cancel.
        </div>
    );

    let errorMessage = (
        <div className="mr-2 p-6">
            An error occurred while publishing the map.
            <br />
            <br />
            <pre>{error}</pre>
        </div>
    );

    function renderMessage(state: string | null) {
        switch (state) {
            case "error":
                return errorMessage;
            case "success":
                return successMessage;
            case "confirmation":
            default:
                return confirmationMessage;
        }
    }

    return (
        <ModalDialog
            visible={props.visible}
            dismiss={props.dismiss}
            header={header}
            footer={footer}
            className="w-3/12"
        >
            <div className="flex flex-row place-content-center">{renderMessage(state)}</div>
        </ModalDialog>
    );
};
