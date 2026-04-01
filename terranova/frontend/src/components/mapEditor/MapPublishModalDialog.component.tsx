import { useState, useEffect } from "react";
import { API_URL } from "../../../static/settings";
import { ModalDialog } from "../ModalDialog";
import { useAuth } from "../../AuthService";
import { setAuthHeaders } from "../../DataController";
import { PktsButton, PktsCommaSeperatedList } from "@esnet/packets-ui-react";

interface MapPublishModalDialogProps {
    map: any;
    visible: boolean;
    dismiss: any;
}

export const MapPublishModalDialog = (props: MapPublishModalDialogProps) => {
    let auth = useAuth();
    let [error, setError] = useState<string>("");
    // poor replica of a proper way to manage form status
    const [status, setStatus] = useState<"loading" | "success" | "error" | null>(null);

    // reset status and error on open/close
    useEffect(() => {
        setStatus(null);
        setError("");
    }, [props.visible]);

    const publishMap = async () => {
        if (!auth || !auth.user) return;
        if (!props.map.mapId) {
            console.error("Missing mapId when opening publish modal.");
            return;
        }
        if (status === "loading") return;
        setStatus("loading");

        const headers = setAuthHeaders({
            "Content-type": "application/json",
        });
        const url = `${API_URL}/map/id/${props.map.mapId}/publish/`;
        const response = await fetch(url, {
            method: "POST",
            headers: headers,
        });

        if (response.ok) {
            setStatus("success");
        } else {
            setStatus("error");
            setError(`Error attempting to publish map. Please try again.`);
            console.error(`Error attempting to publish map.`);
            console.error(response);
        }
    };

    const footer =
        status !== "success" ? (
            <>
                <div className="flex gap-2">
                    <PktsButton
                        variant="destructive"
                        onClick={props.dismiss}
                        disabled={status === "loading"}
                    >
                        {/* <X /> */}
                        Cancel
                    </PktsButton>
                    <PktsButton
                        variant="primary"
                        onClick={publishMap}
                        disabled={status === "loading"}
                    >
                        {/* <CheckSquare /> */}
                        Publish
                    </PktsButton>
                </div>
            </>
        ) : (
            <PktsButton variant="branded" onClick={props.dismiss}>
                Close
            </PktsButton>
        );

    const renderMessage = () => {
        switch (status) {
            case "error":
                return <b className="text-light-error">{error}</b>;
            case "success":
                return <b className="text-light-success">Map Published.</b>;
            default:
                return (
                    <span>
                        Click <b className="text-black">Publish</b> below to proceed, or{" "}
                        <b className="text-black">Cancel</b> to cancel.
                    </span>
                );
        }
    };

    return (
        <ModalDialog
            visible={props.visible}
            setVisible={() => props.dismiss()}
            header={"Publish Map Confirmation"}
            footer={footer}
        >
            <div className="flex flex-col mr-2 p-6">
                <p>Please confirm that you'd like to publish this map.</p>
                <p>
                    This action will make the current saved version of the map,
                    coordinates of all visible objects, and the results of dataset(s) used in the map {" "}
                    <span className="text-red-500">
                        visible to the public internet with no password protection.
                    </span>
                </p>
                {renderMessage()}
            </div>
        </ModalDialog>
    );
};
