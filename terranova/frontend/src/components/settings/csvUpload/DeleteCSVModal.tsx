import React from "react";
import { ModalDialog } from "../../ModalDialog";
import { PktsButton } from "@esnet/packets-ui-react";
import { Trash2, X } from "lucide-react";

interface DeleteCSVModalProps {
    visible: boolean;
    setVisible: React.Dispatch<React.SetStateAction<boolean>>;
    onConfirm: () => void;
    name?: string;
}

export function DeleteCSVModal({ visible, setVisible, onConfirm, name }: DeleteCSVModalProps) {
    const footer = (
        <div className="flex justify-end gap-2 w-full">
            <PktsButton variant="secondary" onClick={() => setVisible(false)}>
                <span className="flex items-center gap-2">
                    <X /> Cancel
                </span>
            </PktsButton>
            <PktsButton variant="primary" onClick={onConfirm}>
                <span className="flex items-center gap-2">
                    <Trash2 /> Delete Forever
                </span>
            </PktsButton>
        </div>
    );

    return (
        <ModalDialog
            visible={visible}
            setVisible={setVisible}
            header="Delete CSV Dataset"
            footer={footer}
        >
            <h4>Delete Dataset</h4>
            <div className="mb-12">
                Dataset '{name}' and all its edge data will be permanently deleted.
            </div>
        </ModalDialog>
    );
}
