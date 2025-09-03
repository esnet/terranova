import { useContext, useId, useState } from "react";
import { DatasetController } from "../../pages/DatasetEditor.page";
import { ContentAccordion } from "../ContentAccordion.component";
import { QueryGroupField } from "./queryPanel/QueryGroupField.component";

interface DatasetEditorQueryPanelProps {
    datasetVisible: boolean;
    toggleDatasetVisible: any;
}

export function DatasetEditorNodeOptionsPanel() {
    const { controller, instance: dataset } = useContext<any>(DatasetController);

    const setDeduplicationField = (value: string) => {
        controller.setProperty("query.node_deduplication_field", value);
    };

    const setCriterion = (idx: number, value: string | null) => {
        value = value === "" ? null : value;
        let curVal = controller?.instance?.query?.node_group_criteria;
        if (!curVal) {
            curVal = [];
        }
        curVal[idx] = value;
        curVal = curVal.filter((val: any) => {
            return val !== "" && val !== null && val !== undefined;
        });
        controller.setProperty("query.node_group_criteria", curVal);
    };

    return (
        <div className="mt-6">
            <ContentAccordion
                header="Advanced Options"
                isOpen={false}
                footer="&nbsp;"
                showEye={false}
                visibility={true}
            >
                <div className="flex flex-wrap">
                    <div className="w-6/12 -mt-2">
                        <fieldset>
                            <legend>Node Grouping</legend>
                            <div className="flex flex-wrap">
                                <div className="w-7/12">
                                    <label className="-mt-1 block">
                                        Form Node Groups On&hellip;
                                    </label>
                                    <QueryGroupField
                                        criteria={controller.instance?.query?.node_group_criteria}
                                        endpoint={controller.instance?.query?.endpoint}
                                        setCriterion={setCriterion}
                                    />
                                </div>
                            </div>
                        </fieldset>
                    </div>
                </div>
            </ContentAccordion>
        </div>
    );
}
