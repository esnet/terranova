import { TemplateDataController } from "../pages/NodeTemplateEditor.page";
import { useContext } from "react";
import { useParams } from "react-router-dom";
import { DataControllerContextType } from "../types/mapeditor";
import { Icon } from "../components/Icon.component";
import { Favorites } from "../context/FavoritesContextProvider";
import { UserDataController } from "../context/UserDataContextProvider";

export function TemplateEditorForm(props: any) {
    const { templateId } = useParams();
    const { controller, instance } = useContext(
        TemplateDataController
    ) as DataControllerContextType;

    let favorites = useContext(Favorites);
    let { controller: userDataController, instance: userdata } = useContext(
        UserDataController
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
        <form onSubmit={props.persistTemplate}>
            <div className="panel-header">
                <div className="flex flex-row">
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
                    Node Template Builder
                </div>
            </div>
            <div className="panel-body">
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
            <div className="panel-footer flex-row flex justify-end">
                <input type="button" className="mr-4" value="Update Preview" />
                <input type="submit" className="primary" value="Save" />
            </div>
        </form>
    );
}
