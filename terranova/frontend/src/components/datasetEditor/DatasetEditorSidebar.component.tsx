import React, { ChangeEvent } from "react";

import { API_URL } from "../../../static/settings";
import { ClipboardCopyInput } from "../ClipboardCopyInput.component";
import { PREVIEW_MODE_OPTIONS } from "../../data/constants";
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
 *  <li>
 *      <label>Type: Dropdown</label>
 *      <dl>
 *          <dt>Preview Mode</dt>
 *          <dd>Selects the preview mode to display, one of Edge Graph, Table View, or Geographic</dd>
 *      </dl>
 *   </li>
 *   <li>
 *      <label>Type: ClipboardCopyInput</label>
 *      <dl>
 *          <dt>Static Dataset URL</dt>
 *          <dd>Displays a readonly field and button to copy for static dataset endpoint</dd>
 *      </dl>
 *   </li>
 *   <li>
 *      <label>Type: ClipboardCopyInput</label>
 *      <dl>
 *          <dt>Dynamic Dataset URL</dt>
 *          <dd>Displays a readonly field and button to copy for the dynamic dataset endpoint</dd>
 *      </dl>
 *   </li>
 * </ul>
 */
export const DatasetEditorSidebar = (props: IDatasetEditorSidebarProps) => {
    const { visualizationMode, handleOnModeChange, dataset } = props;

    const datasetInstance = dataset;

    const staticURL = `${API_URL}/output/dataset/${datasetInstance.datasetId}/${visualizationMode}/static`;
    const dynamicURL = `${API_URL}/output/dataset/${datasetInstance.datasetId}/${visualizationMode}/live`;

    return (
        <div id="dataset-editor-sidebar" className="w-4/12 p-2 self-start sidebar-form relative">
            <div className="absolute right-0 opacity-50">
                <label key={dataset.version} className="-mt-2 -mb-4">
                    Current Version: {dataset.version}
                </label>
            </div>
            {/* Preview Mode dropdown */}
            <label htmlFor="preview-mode">Preview Mode:</label>
            <br />
            <select
                id="preview-mode"
                onChange={handleOnModeChange}
                className="w-full"
                role="listbox"
            >
                {PREVIEW_MODE_OPTIONS.map(({ label, value }) => (
                    <option role="option" value={value} key={`preview-mode-option-${value}`}>
                        {label}
                    </option>
                ))}
            </select>
            <ClipboardCopyInput
                id="static-dataset-input"
                label="Static Dataset URL"
                iconName="clipboard-copy"
                defaultValue={staticURL}
            />
            <ClipboardCopyInput
                id="dynamic-dataset-input"
                label="Dynamic Dataset URL"
                iconName="clipboard-copy"
                defaultValue={dynamicURL}
            />
        </div>
    );
};
