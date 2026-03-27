import { TemplateDataController } from "../pages/NodeTemplateEditor.page";
import { useContext } from "react";
import { useParams } from "react-router-dom";
import { DataControllerContextType } from "../types/mapeditor";
import { Icon } from "../components/Icon.component";
import { Favorites } from "../context/FavoritesContextProvider";
import { UserDataController } from "../context/UserDataContextProvider";
import {
    PktsAccordion,
    PktsInputRow,
    PktsInputText,
    PktsInputTextArea,
    PktsButton,
} from "@esnet/packets-ui-react";

/**
 * This form has two "modes" for node template creation and updating,
 * determined if a templateId is supplied in the URL parameters.
 */
export function TemplateEditorForm(props: any) {
    const { templateId } = useParams();
    const create = templateId === undefined;
    const { controller } = useContext(TemplateDataController) as DataControllerContextType;

    let favorites = useContext(Favorites);
    let { controller: userDataController } = useContext(
        UserDataController,
    ) as DataControllerContextType;

    const markFavorite = () => {
        // Use raw ID list from userdata for bookkeeping (favorites context stores full objects for display)
        const rawFavorites = userDataController.instance?.favorites ?? {};
        const currentList: string[] = rawFavorites.templates ?? [];
        if (currentList.includes(templateId)) {
            currentList.splice(currentList.indexOf(templateId), 1);
        } else {
            currentList.push(templateId);
        }
        rawFavorites.templates = currentList;
        userDataController.setProperty(`favorites`, rawFavorites);
        userDataController.update();
    };

    const setName = (e: any) => {
        controller.setProperty("name", e.target.value);
    };

    const setTemplate = (e: any) => {
        controller.setProperty("template", e.target.value);
    };

    return (
        <PktsAccordion className="tn-accordion" header={create ? "Create Node Template" : "Update Node Template"}>
            <form onSubmit={props.persistTemplate} className="flex flex-col gap-4">
                {templateId && (
                    <PktsInputRow label="ID">
                        <PktsInputText name="id" defaultValue={templateId} />
                    </PktsInputRow>
                )}
                <PktsInputRow label="Name">
                    <PktsInputText name="name" value={props.instance.name} onChange={setName} />
                </PktsInputRow>
                <PktsInputRow label="SVG Code">
                    <PktsInputTextArea
                        resize="vertical"
                        className="h-64"
                        name="template"
                        value={props.instance.template}
                        onChange={setTemplate}
                    />
                </PktsInputRow>
                {create ? (
                    <PktsButton variant="primary" type="submit">Create</PktsButton>
                ) : (
                    <PktsButton variant="primary" type="submit">Update</PktsButton>
                )}
                {!create && (
                    <div className="panel-body">
                        {userDataController.instance?.favorites?.templates?.includes(templateId) ? (
                            <div className="icon sm p-1 mr-2">
                                <Icon
                                    name="lucide-star"
                                    fill="#00a0d6"
                                    className="stroke-esnetblue-400 -mt-[0.125rem] -ml-[0.125rem]"
                                    onClick={markFavorite}
                                />
                            </div>
                        ) : (
                            <div className="icon sm p-1 mr-2">
                                <Icon
                                    name="lucide-star"
                                    className="stroke-esnetblue-400 -mt-[0.125rem] -ml-[0.125rem]"
                                    onClick={markFavorite}
                                />
                            </div>
                        )}
                        <div className="flex-row flex">
                            <div className="w-6/12 pr-2">
                                <div>
                                    <label>Name</label>
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        className="w-full"
                                        value={props.instance.name}
                                        onChange={setName}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="w-6/12 pl-2">
                                <div>
                                    <label>ID</label>
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        className="w-full text-esnetwhite-900"
                                        defaultValue={props.instance.templateId}
                                        disabled={true}
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label>SVG Code</label>
                        </div>
                        <div>
                            <textarea
                                className="w-full monospace"
                                rows={18}
                                value={props.instance.template}
                                onChange={setTemplate}
                            ></textarea>
                        </div>
                    </div>
                )}
            </form>
        </PktsAccordion>
    );
}
