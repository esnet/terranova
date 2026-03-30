import { TemplateDataController } from "../pages/NodeTemplateEditor.page";
import { useContext, useState } from "react";
import { useParams } from "react-router-dom";
import { DataControllerContextType } from "../types/mapeditor";

import {
    PktsAccordion,
    PktsInputRow,
    PktsInputText,
    PktsInputTextArea,
    PktsButton,
} from "@esnet/packets-ui-react";
import { InputCopy } from "./InputCopy";
import { Save, X } from "lucide-react";

/**
 * This form has two "modes" for node template creation and updating,
 * determined if a templateId is supplied in the URL parameters.
 */
export function TemplateEditorForm(props: any) {
    const { templateId } = useParams();
    const create = templateId === undefined;
    const [updating, setUpdating] = useState(false);
    const { controller } = useContext(TemplateDataController) as DataControllerContextType;


    const setName = (e: any) => {
        controller.setProperty("name", e.target.value);
        setUpdating(true);
    };

    const setTemplate = (e: any) => {
        controller.setProperty("template", e.target.value);
        setUpdating(true);
    };

    const discard = (e: any) => {
        e.preventDefault();
        setUpdating(false);
        controller.fetch();
    };

    const save = (e: any) => {
        e.preventDefault();
        setUpdating(false);
        props.persistTemplate(e);
    };

    return (
        <PktsAccordion className="tn-accordion" header={create ? "Create Node Template" : "Update Node Template"}>
            <form onSubmit={props.persistTemplate} className="flex flex-col gap-4">
                {templateId && (
                    <PktsInputRow label="ID">
                        <InputCopy name="id" defaultValue={templateId} />
                    </PktsInputRow>
                )}
                <PktsInputRow label="Name" required>
                    <PktsInputText name="name" value={props.instance.name} onChange={setName} />
                </PktsInputRow>
                <PktsInputRow label="SVG Code" required>
                    <PktsInputTextArea
                        resize="vertical"
                        className="h-64 monospace"
                        name="template"
                        value={props.instance.template}
                        onChange={setTemplate}
                    />
                </PktsInputRow>
                {create ? (
                    <PktsButton onClick={save} variant="primary">
                        Create <Save />
                    </PktsButton>
                ) : (
                    <div className="flex gap-4">
                        <PktsButton disabled={!updating} variant="destructive" onClick={discard}>
                            Discard <X />
                        </PktsButton>
                        <PktsButton disabled={!updating} onClick={save} variant="primary">
                            Save Changes <Save />
                        </PktsButton>
                    </div>
                )}
            </form>
        </PktsAccordion>
    );
}
