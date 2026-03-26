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
        if (favorites?.templates?.includes(templateId)) {
            const index = favorites?.templates?.indexOf(templateId);
            favorites?.templates?.splice(index, 1);
            userDataController.setProperty(`favorites`, favorites);
            userDataController.update();
        } else {
            favorites?.templates?.push(templateId);
            userDataController.setProperty(`favorites`, favorites);
            userDataController.update();
        }
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
                    <PktsButton variant="primary">Create</PktsButton>
                ) : (
                    <PktsButton variant="primary">Update</PktsButton>
                )}
                {!create && (
                    <div className="panel-body">
                        {favorites?.templates?.includes(templateId) ? (
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
