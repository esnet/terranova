import React from "react";
import { BadgePlus, Edit, Plus, Trash2 } from "lucide-react";
import { PktsButton, PktsInputRow, PktsInputText } from "@esnet/packets-ui-react";
import Card from "../../Card";
import { InputCopy } from "../../../components/InputCopy";

interface AccessTokenCardProps {
    accessToken: any;
    dynamicConfiguration: boolean;
    onReconfigure: () => void;
    onDelete: () => void;
}

export function AccessTokenCard({
    accessToken,
    dynamicConfiguration,
    onReconfigure,
    onDelete,
}: AccessTokenCardProps) {
    return (
        <Card header={accessToken.project_id} icon={<BadgePlus />}>
            <div className="flex flex-col gap-4">
                <p>Sheets Data is cached hourly</p>

                <PktsInputRow label="Project ID">
                    <InputCopy value={accessToken.project_id} />
                </PktsInputRow>

                <PktsInputRow label="Client Email">
                    <InputCopy value={accessToken.client_email} />
                </PktsInputRow>

                <PktsInputRow label="Token URI">
                    <InputCopy value={accessToken.auth_uri} />
                </PktsInputRow>

                <PktsInputRow label="Private Key">
                    <PktsInputText value="••••••••• (configured)" disabled />
                </PktsInputRow>

                {dynamicConfiguration && (
                    <div className="flex justify-end gap-4">
                        <PktsButton
                            className="w-fit!"
                            variant="destructive"
                            prepend={<Trash2 />}
                            onClick={onDelete}
                        >
                            Delete
                        </PktsButton>
                        <PktsButton
                            className="w-fit!"
                            variant="primary"
                            prepend={<Edit />}
                            onClick={onReconfigure}
                        >
                            Reconfigure JWT
                        </PktsButton>
                    </div>
                )}
            </div>
        </Card>
    );
}
