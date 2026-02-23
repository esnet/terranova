import { TemplateDataController } from "../pages/NodeTemplateEditor.page";
import { useContext } from "react";
import { useParams } from "react-router-dom";
import { DataControllerContextType } from "../types/mapeditor";
import { Icon } from "../components/Icon.component";
import { Favorites } from "../context/FavoritesContextProvider";
import { UserDataController } from "../context/UserDataContextProvider";
import { ESAccordion, ESButton, ESInputRow, ESInputText, ESInputTextArea } from "@esnet/packets-ui";

/**
 * This form has two "modes" for node template creation and updating,
 * determined if a templateId is supplied in the URL parameters.
 */
export function TemplateEditorForm(props: any) {
    const { templateId } = useParams();
    const create = templateId === undefined;
    const { controller, instance } = useContext(
        TemplateDataController,
    ) as DataControllerContextType;

    let favorites = useContext(Favorites);
    let { controller: userDataController, instance: userdata } = useContext(
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
        <ESAccordion header={create ? "Create Node Template" : "Update Node Template"}>
            <form onSubmit={props.persistTemplate} className="flex flex-col gap-4">
                {templateId && (
                    <ESInputRow label="ID">
                        <ESInputText name="id" defaultValue={templateId} />
                    </ESInputRow>
                )}
                <ESInputRow label="Name">
                    <ESInputText name="name" value={props.instance.name} onChange={setName} />
                </ESInputRow>
                <ESInputRow label="SVG Code">
                    <ESInputTextArea
                        resize="vertical"
                        className="h-64"
                        name="template"
                        value={props.instance.template}
                        onChange={setTemplate}
                    />
                </ESInputRow>
                {create ? <ESButton>Create</ESButton> : <ESButton>Update</ESButton>}
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
        </ESAccordion>
    );
}
