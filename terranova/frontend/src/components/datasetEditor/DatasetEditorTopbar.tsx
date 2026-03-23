import { PktsInputText, PktsButton, PktsIconButton } from "@esnet/packets-ui-react";
import { Database, Pencil, Save, Trash } from "lucide-react";
import React, { useState } from "react";

interface IDatasetEditorTopbarProps {
    datasetName: string;
    loading: boolean;
    onUpdateName: (newName: string) => void;
    onDiscard: () => void;
    onSave: () => void;
}

export const DatasetEditorTopbar = ({
    datasetName,
    loading,
    onUpdateName,
    onDiscard,
    onSave,
}: IDatasetEditorTopbarProps) => {
    const [editingName, setEditingName] = useState(false);

    const nameFormSubmit = (e: any) => {
        e.preventDefault();
        const newName = e.target.elements["dataset-name"].value;
        onUpdateName(newName);
        setEditingName(false);
    };

    return (
        <div className="sticky top-0 shadow-md z-601 w-full">
            {/* hide anything above the sticky topbar */}
            <div className="h-4 bg-light-background" />
            <div className="w-full flex justify-between py-2 px-4 bg-light-secondary text-white overflow-hidden">
                <div className="flex gap-2 items-center justify-center">
                    <Database />
                    <b>Editing: </b>
                    {!editingName ? (
                        <>
                            <span className="text-nowrap font-bold">{datasetName}</span>
                            <Pencil
                                className="cursor-pointer"
                                onClick={() => setEditingName(true)}
                            />
                        </>
                    ) : (
                        <form onSubmit={nameFormSubmit} className="flex gap-x-2 items-center">
                            <div className="w-full">
                                <PktsInputText name="dataset-name" defaultValue={datasetName} />
                            </div>
                            <button className="contents">
                                <Save className="cursor-pointer" />
                            </button>
                        </form>
                    )}
                </div>

                <div className="hidden lg:flex w-96 gap-2">
                    <PktsButton
                        variant="destructive"
                        disabled={loading}
                        onClick={() => window.location.reload()}
                    >
                        Discard Changes
                    </PktsButton>
                    <PktsButton variant="primary" disabled={loading} onClick={onSave}>
                        Save Changes
                    </PktsButton>
                </div>
                <div className="flex lg:hidden gap-2">
                    <PktsIconButton
                        variant="destructive"
                        disabled={loading}
                        onClick={() => window.location.reload()}
                    >
                        <Trash />
                    </PktsIconButton>
                    <PktsIconButton variant="primary" disabled={loading} onClick={onSave}>
                        <Save />
                    </PktsIconButton>
                </div>
            </div>
        </div>
    );
};
