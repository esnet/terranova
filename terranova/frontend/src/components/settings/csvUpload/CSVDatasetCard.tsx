import React from "react";
import { FileText, Trash2 } from "lucide-react";
import { PktsButton } from "@esnet/packets-ui-react";
import Card from "../../Card";

interface CSVDatasetCardProps {
    dataset: { csv_id: string; csv_name: string; edge_count?: number };
    onDelete: () => void;
}

export function CSVDatasetCard({ dataset, onDelete }: CSVDatasetCardProps) {
    return (
        <Card header={dataset.csv_name} icon={<FileText />}>
            <div className="flex flex-col gap-4">
                {dataset.edge_count !== undefined && (
                    <p className="text-sm text-color-text-alt">{dataset.edge_count} edges</p>
                )}
                <div className="flex justify-end">
                    <PktsButton
                        className="w-fit!"
                        variant="destructive"
                        prepend={<Trash2 />}
                        onClick={onDelete}
                    >
                        Delete
                    </PktsButton>
                </div>
            </div>
        </Card>
    );
}
