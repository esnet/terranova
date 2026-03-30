import { createContext, useState, useContext, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { DataController } from "../DataController";
import { UserDataController } from "../context/UserDataContextProvider";
import { LastEdited } from "../context/LastEditedContextProvider";
import { DataControllerType, DataControllerContextType } from "../types/mapeditor";
import { TemplateEditorForm } from "../components/TemplateEditorForm";
import { TemplatePreview } from "../components/TemplatePreview";
import { API_URL, TOOLTIP_TTL } from "../../static/settings";
import { PktsAlert } from "@esnet/packets-ui-react";

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

    const [showSaveAlert, setShowSaveAlert] = useState(false);

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
            TemplatePersistenceController.update().then(() => {
                setShowSaveAlert(true);
                setTimeout(() => {
                    setShowSaveAlert(false);
                }, TOOLTIP_TTL * 1000);

                // on update, also set last edited
                let newTemplates = lastEdited?.templates?.filter((e: any) => e !== templateId);
                newTemplates?.push(templateId); // Push at the end
                if (newTemplates?.length > 3) {
                    newTemplates?.shift(); // removes the first element
                }
                if (lastEdited) {
                    lastEdited.templates = newTemplates;
                }
                userDataController.setProperty(`lastEdited`, lastEdited);
                userDataController.update();
            });
        }
    }

    return (
        <TemplateDataController.Provider value={{ controller, instance: template }}>
            <main className="w-full flex flex-col xl:flex-row gap-8 p-8">
                <TemplateEditorForm
                    instance={template}
                    setInstance={setTemplate}
                    persistTemplate={persistTemplate}
                />

                <TemplatePreview instance={template}></TemplatePreview>
                {showSaveAlert && (
                    <div className="fixed right-4 bottom-4">
                        <PktsAlert variant="success" title="Node Template Saved">
                            Updated {controller.instance.name}
                        </PktsAlert>
                    </div>
                )}
            </main>
        </TemplateDataController.Provider>
    );
}
