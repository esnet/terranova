import { createContext, useState, useContext, useEffect } from "react";
import { useParams } from "react-router-dom";

import { DataController } from "../DataController";
import { UserDataController } from "../context/UserDataContextProvider";
import { LastEdited } from "../context/LastEditedContextProvider";
import { DataControllerType, DataControllerContextType } from "../types/mapeditor";
import { TemplateEditorForm } from "../components/TemplateEditorForm";
import { TemplatePreview } from "../components/TemplatePreview";
import { API_URL } from "../../static/settings";

export const TemplateDataController = createContext<DataControllerContextType | null>(null);

export function NodeTemplateEditorPageComponent() {
    // set up some state variables for the controller to work with
    const [template, setTemplate] = useState<any>({ name: "", template: "" });
    const { templateId } = useParams();

    let lastEdited = useContext(LastEdited);
    let { controller: userDataController, instance: userdata } = useContext(
        UserDataController
    ) as DataControllerContextType;

    const [controller, _setController] = useState<DataControllerType>(
        new DataController(null, template, setTemplate)
    );
    if (templateId) {
        // we are editing a Template
        controller.link = `${API_URL}/template/id/${templateId}`;
        useEffect(() => {
            // trigger map list fetch
            controller.fetch();
        }, []); // on initial render
    }

    // get some information from the DataController (set of options for 'select' elements, e.g.)
    function persistTemplate(event: any) {
        // we will want to do some work with the DataController here:
        // putting together a map instance and calling into it to persist it.
        event.preventDefault();
        let persistenceUrl = API_URL + "/template/";
        let persistenceMethod = "create";
        if (template.templateId) {
            persistenceUrl = API_URL + `/template/id/${template.templateId}/`;
            persistenceMethod = "update";
        }
        let TemplatePersistenceController: any = new DataController(persistenceUrl, template, null);
        TemplatePersistenceController[persistenceMethod]();

        controller.setInstance(TemplatePersistenceController.instance);

        // Update lastEdited
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
    }

    return (
        <TemplateDataController.Provider value={{ controller, instance: template }}>
            <main className="main-content md:flex">
                <div className="w-full md:w-6/12 mx-auto pt-6 pb-12">
                    <TemplateEditorForm
                        instance={template}
                        setInstance={setTemplate}
                        persistTemplate={persistTemplate}
                    ></TemplateEditorForm>
                </div>

                <div className="md:w-5/12 mx-auto mb-6">
                    <TemplatePreview instance={template}></TemplatePreview>
                </div>
            </main>
        </TemplateDataController.Provider>
    );
}
