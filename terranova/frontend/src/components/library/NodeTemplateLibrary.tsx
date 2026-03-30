import React, { useEffect, useState, useContext } from "react";
import { API_URL } from "../../../static/settings";
import { DataController } from "../../DataController";
import { DataControllerType, DataControllerContextType } from "../../types/mapeditor";
import { Favorites } from "../../context/FavoritesContextProvider";
import { UserDataController } from "../../context/UserDataContextProvider";
import { markFavorite } from "./utils";
import Card from "../Card";
import { PktsInputText, PktsButton, PktsSpinner } from "@esnet/packets-ui-react";
import { Plus, Star } from "lucide-react";
import { Link } from "react-router-dom";

const CROSSHAIRS = `<line
    x1="0"
    y1="-25"
    x2="0"
    y2="25"
    stroke-dasharray="1,1"
    stroke="rebeccapurple"
    stroke-width="0.1"
    stroke-opacity="0.5" />
  <line
    x1="-25"
    y1="0"
    x2="25"
    y2="0"
    stroke-dasharray="1,1"
    stroke="rebeccapurple"
    stroke-width="0.1"
    stroke-opacity="0.5" />`;

export function NodeTemplateLibrary() {
    const [templateList, setTemplateList] = useState([]);
    const [filterText, setFilterText] = useState("");
    const [loading, setLoading] = useState(true);

    const favorites = useContext(Favorites);
    const { controller: userDataController } = useContext(
        UserDataController,
    ) as DataControllerContextType;

    const fieldsetString =
        "?fields=templateId&fields=name&fields=version" +
        "&fields=lastUpdatedBy&fields=lastUpdatedOn&fields=template&version=all";

    const [controller] = useState<DataControllerType>(
        new DataController(
            API_URL + "/templates/" + fieldsetString,
            templateList,
            setTemplateList,
        ) as any,
    );

    useEffect(() => {
        const fetchTemplates = async () => {
            setLoading(true);
            await controller.fetch();
            setLoading(false);
        };
        fetchTemplates();
    }, []);

    // 1. Filter items by text
    const filteredItems = templateList.filter((item: any) =>
        item.name?.toLowerCase().includes(filterText.toLowerCase()),
    );

    // 2. Deduplicate / Group unique templates by ID
    const uniqueTemplates = Object.values(
        filteredItems.reduce((acc: Record<string, any>, template: any) => {
            if (!acc[template.templateId]) acc[template.templateId] = template;
            return acc;
        }, {}),
    );

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-row justify-between items-center">
                <Link to="/template/new" className="contents">
                    <PktsButton variant="secondary" className="w-fit" append={<Plus />}>
                        Create New Template
                    </PktsButton>
                </Link>
                <PktsInputText
                    className="w-64"
                    placeholder="Filter by name..."
                    value={filterText}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFilterText(e.target.value || "")
                    }
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                {loading ? (
                    <div className="col-span-2 mx-auto py-8">
                        <PktsSpinner />
                    </div>
                ) : uniqueTemplates.length > 0 ? (
                    uniqueTemplates.map((template: any) => (
                        <Card key={template.templateId} className="flex flex-col gap-2">
                            <div className="text-xl font-bold flex gap-2">
                                <Star
                                    className={`cursor-pointer stroke-light-primary ${
                                        favorites?.templates?.includes(template.templateId)
                                            ? "fill-light-primary"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        markFavorite(
                                            userDataController,
                                            favorites,
                                            "templates",
                                            template.templateId,
                                        )
                                    }
                                />
                                <Link
                                    className="text-nowrap overflow-hidden text-truncate"
                                    to={`/template/${template.templateId}`}
                                >
                                    {template.name}
                                </Link>
                            </div>

                            <div className="flex">
                                <div className="w-24 h-24">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="-25 -25 50 50"
                                        dangerouslySetInnerHTML={{
                                            __html: `${template.template}${CROSSHAIRS}`,
                                        }}
                                    ></svg>
                                </div>
                                <div className="flex flex-col justify-center px-4 italic text-esnetblack-500 gap-2">
                                    <span>
                                        Last Updated:{" "}
                                        {new Date(template.lastUpdatedOn).toLocaleString()}
                                    </span>
                                    <span>Last Updated By: {template.lastUpdatedBy}</span>
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-2 text-center py-12 text-esnetblack-500">
                        <h4>No templates found.</h4>
                    </div>
                )}
            </div>
        </div>
    );
}
