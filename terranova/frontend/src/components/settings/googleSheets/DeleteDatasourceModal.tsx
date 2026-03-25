import React from "react";
import { ModalDialog } from "../../ModalDialog";
import { PktsButton } from "@esnet/packets-ui-react";
import { Trash2, X } from "lucide-react";

interface DeleteDatasourceModalProps {
    visible: boolean;
    setVisible: React.Dispatch<React.SetStateAction<boolean>>;
    onConfirm: () => void;
}

export function DeleteDatasourceModal({
    visible,
    setVisible,
    onConfirm,
}: DeleteDatasourceModalProps) {
    const footer = (
        <div className="flex justify-end gap-2 w-full">
            <PktsButton variant="secondary" onClick={() => setVisible(false)}>
                <span className="flex items-center gap-2">
                    <X /> Cancel
                </span>
            </PktsButton>
            <PktsButton variant="primary" onClick={onConfirm}>
                <span className="flex items-center gap-2">
                    <Trash2 /> Delete Datasource Forever
                </span>
            </PktsButton>
        </div>
    );

    return (
        <ModalDialog
            visible={visible}
            setVisible={setVisible}
            header="Delete Sheets Datasource"
            footer={footer}
        >
            <h4>Delete Datasource</h4>
            <div className="mb-12">
                Datasource 'Mocked Network Traffic' will be permanently deleted.
            </div>
        </ModalDialog>
    );
}
