import React from "react";
import { PktsButton, PktsInputRow, PktsInputTextArea } from "@esnet/packets-ui-react";
import { Check, X } from "lucide-react";
import { ModalDialog } from "../../ModalDialog";

interface AddJwtModalProps {
    visible: boolean;
    setVisible: React.Dispatch<React.SetStateAction<boolean>>;
    onConfirm: (jwtText: string) => void;
}

export function AddJWTModal({ visible, setVisible, onConfirm }: AddJwtModalProps) {
    const [jwtText, setJwtText] = React.useState("");

    const footer = (
        <div className="flex gap-2 justify-end">
            <PktsButton className="w-fit!" variant="destructive" onClick={() => setVisible(false)}>
                <span className="flex items-center gap-2">
                    <X /> Cancel
                </span>
            </PktsButton>
            <PktsButton className="w-fit!" variant="primary" onClick={() => onConfirm(jwtText)}>
                <span className="flex items-center gap-2">
                    <Check /> Add JWT
                </span>
            </PktsButton>
        </div>
    );

    return (
        <ModalDialog visible={visible} setVisible={setVisible} header="Add JWT" footer={footer}>
            <PktsInputRow label="JWT">
                <PktsInputTextArea
                    className="h-48"
                    name="JWT"
                    placeholder="Enter JWT here"
                    value={jwtText}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setJwtText(e.target.value)
                    }
                />
            </PktsInputRow>
        </ModalDialog>
    );
}
