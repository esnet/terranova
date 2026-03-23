import React, { ChangeEvent } from "react";
import { API_URL } from "../../../static/settings";
import { InputCopy } from "../InputCopy";
import { PREVIEW_MODE_OPTIONS } from "../../data/constants";
import { ESInputRow, ESInputSelect, ESInputOption, ESDivider } from "@esnet/packets-ui";

interface IDatasetEditorSidebarProps {
    visualizationMode: string;
    handleOnModeChange: (e: ChangeEvent<HTMLSelectElement>) => void;
    dataset: any;
}

/**
 * This component renders the sidebar to the right of the map visualization on the layer editor page.
 * It contains of the following controls and components:
 *
 * <ul>
 * <li>
 * <label>Type: Dropdown</label>
 * <dl>
 * <dt>Preview Mode</dt>
 * <dd>Selects the preview mode to display, one of Edge Graph, Table View, or Geographic</dd>
 * </dl>
 * </li>
 * <li>
 * <label>Type: ClipboardCopyInput</label>
 * <dl>
 * <dt>Static Dataset URL</dt>
 * <dd>Displays a readonly field and button to copy for static dataset endpoint</dd>
 * </dl>
 * </li>
 * <li>
 * <label>Type: ClipboardCopyInput</label>
 * <dl>
 * <dt>Dynamic Dataset URL</dt>
 * <dd>Displays a readonly field and button to copy for the dynamic dataset endpoint</dd>
 * </dl>
 * </li>
 * </ul>
 */
export const DatasetEditorSidebar = ({
    visualizationMode,
    handleOnModeChange,
    dataset,
}: IDatasetEditorSidebarProps) => {
    const staticURL = `${API_URL}/output/dataset/${dataset.datasetId}/${visualizationMode}/static`;
    const dynamicURL = `${API_URL}/output/dataset/${dataset.datasetId}/${visualizationMode}/live`;

    return (
        <div className="min-w-64 w-2/5 2xl:w-1/4 flex flex-col gap-2">
            <div className="text-center">Current Version: {dataset.version}</div>
            <ESDivider />

            <ESInputRow label="Preview Mode">
                <ESInputSelect
                    name="preview-mode"
                    onChange={handleOnModeChange}
                    value={visualizationMode}
                    className="w-full"
                >
                    {PREVIEW_MODE_OPTIONS.map(({ label, value }) => (
                        <ESInputOption value={value} key={`preview-mode-option-${value}`}>
                            {label}
                        </ESInputOption>
                    ))}
                </ESInputSelect>
            </ESInputRow>

            <ESInputRow label="Static Dataset URL">
                <InputCopy id="static-dataset-input" value={staticURL} />
            </ESInputRow>

            <ESInputRow label="Dynamic Dataset URL">
                <InputCopy id="dynamic-dataset-input" value={dynamicURL} />
            </ESInputRow>
        </div>
    );
};
