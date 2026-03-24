import { useContext } from "react";
import { DatasetController } from "../../pages/DatasetEditor.page";
import { QueryGroupField } from "./queryPanel/QueryGroupField.component";
import { Accordion } from "../Accordion";
import { PktsInputRow } from "@esnet/packets-ui-react";

export function DatasetEditorNodeOptionsPanel() {
    const { controller } = useContext<any>(DatasetController);

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
        <Accordion header="Advanced Options" footer showEye={false}>
            <div className="flex gap-2">
                <fieldset className="w-1/2">
                    <legend>Node Grouping</legend>
                    <PktsInputRow label="Form Node Groups On...">
                        <QueryGroupField
                            criteria={controller.instance?.query?.node_group_criteria}
                            endpoint={controller.instance?.query?.endpoint}
                            setCriterion={setCriterion}
                        />
                    </PktsInputRow>
                </fieldset>
            </div>
        </Accordion>
    );
}
