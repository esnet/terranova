import { useParams } from "react-router-dom";
import {
    DatasetLibraryCard,
    MapLibraryCard,
    TemplateLibraryCard,
} from "../components/LibraryCard.component";

export function DatasetLibraryPageComponent() {
    const { datatype } = useParams();

    function renderSubItem() {
        if (datatype === "datasets") {
            return (
                <div>
                    <DatasetLibraryCard />
                </div>
            );
        } else if (datatype === "maps") {
            return (
                <div>
                    <MapLibraryCard />
                </div>
            );
        } else if (datatype === "templates") {
            return (
                <div>
                    <TemplateLibraryCard />
                </div>
            );
        }
    }

    return (
        <main className="main-content w-full">
            <div>{renderSubItem()}</div>
        </main>
    );
}
