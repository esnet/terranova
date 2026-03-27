import { createContext, useState, useContext, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { DataController } from "../DataController";
import { UserDataController } from "../context/UserDataContextProvider";
import { LastEdited } from "../context/LastEditedContextProvider";
import { DataControllerType, DataControllerContextType } from "../types/mapeditor";
import { TemplateEditorForm } from "../components/TemplateEditorForm";
import { TemplatePreview } from "../components/TemplatePreview";
import { API_URL } from "../../static/settings";

export const TemplateDataController = createContext<DataControllerContextType | null>(null);

/**
 * This page functions as the component for both template creation and editing.
 */
export function NodeTemplateEditorPageComponent() {
    // set up some state variables for the controller to work with
    const [template, setTemplate] = useState<any>({ name: "", template: "" });
    const { templateId } = useParams();
    // are we creating or updating a template Id? Both can be referred to as "persisting" the template.
    const create = templateId === undefined;

    let lastEdited = useContext(LastEdited);
    let { controller: userDataController } = useContext(
        UserDataController,
    ) as DataControllerContextType;

    const [controller, _setController] = useState<DataControllerType>(
        new DataController(null, template, setTemplate),
    );

    useEffect(() => {
        if (!templateId) return;
        // we are editing a Template
        controller.link = `${API_URL}/template/id/${templateId}`;
        // trigger map list fetch
        controller.fetch();
    }, [templateId]);

    const navigate = useNavigate();
    // handle template persistence, be it create or update
    async function persistTemplate(event: any) {
        // we will want to do some work with the DataController here:
        // putting together a map instance and calling into it to persist it.
        event.preventDefault();

        // api url endpoint varies based on if we are creating or updating
        const persistenceUrl = create
            ? API_URL + "/template/"
            : API_URL + `/template/id/${templateId}/`;
        const TemplatePersistenceController: any = new DataController(
            persistenceUrl,
            template,
            null,
        );
        if (create) {
            await TemplatePersistenceController.create();
            navigate(`/template/${TemplatePersistenceController.instance.templateId}`);
        } else {
            TemplatePersistenceController.update();
            // Update lastEdited using the userdata IDs (not the LastEdited full-objects context).
            const currentLastEdited = userDataController.instance?.lastEdited ?? {};
            let newTemplates = ((currentLastEdited?.templates ?? []) as string[]).filter((e) => e !== templateId);
            newTemplates.push(templateId); // Push at the end (newest = highest index)
            if (newTemplates.length > 3) {
                newTemplates.shift(); // removes the oldest element
            }
            userDataController.setProperty(`lastEdited`, { ...currentLastEdited, templates: newTemplates });
            userDataController.update();
        }
    }

    return (
        <TemplateDataController.Provider value={{ controller, instance: template }}>
            <main className="w-full flex flex-col lg:flex-row gap-8 p-8 ">
                <TemplateEditorForm
                    instance={template}
                    setInstance={setTemplate}
                    persistTemplate={persistTemplate}
                />

                <TemplatePreview instance={template}></TemplatePreview>
            </main>
        </TemplateDataController.Provider>
    );
}
