import { Database, Pencil, Save } from "lucide-react";
import React, { useState } from "react";
import { ESButton, ESIconButton, ESInputText } from "@esnet/packets-ui";

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
                                <ESInputText name="dataset-name" defaultValue={datasetName} />
                            </div>
                            <button className="contents">
                                <Save className="cursor-pointer" />
                            </button>
                        </form>
                    )}
                </div>

                {/* Desktop Buttons */}
                <div className="hidden lg:flex gap-2">
                    <ESButton
                        variant="destructive"
                        disabled={loading}
                        className="hidden md:auto"
                        onClick={onDiscard}
                    >
                        Discard Changes
                    </ESButton>
                    <ESButton disabled={loading} className="hidden md:auto" onClick={onSave}>
                        Save Changes
                    </ESButton>
                </div>

                {/* Mobile Icon Buttons */}
                <div className="flex lg:hidden gap-2">
                    <ESIconButton
                        variant="destructive"
                        name="trash"
                        disabled={loading}
                        className="block md:hidden"
                        onClick={onDiscard}
                    />
                    <ESIconButton
                        variant="primary"
                        name="save"
                        disabled={loading}
                        className="block md:hidden"
                        onClick={onSave}
                    />
                </div>
            </div>
        </div>
    );
};
