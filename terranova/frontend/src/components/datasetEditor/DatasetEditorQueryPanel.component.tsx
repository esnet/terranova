import { useContext, useId, useState, useEffect } from "react";
import { DatasetController } from "../../pages/DatasetEditor.page";
import { QueryCriterion } from "./queryPanel/QueryCriterion.component";
import { ContentAccordion } from "../ContentAccordion.component";
import { Icon } from "../Icon.component";
import { DEFAULT_INPUT_DEBOUNCE } from "../../data/constants";
import { API_URL } from "../../../static/settings";
import { quickhash } from "../../data/utils";
import { setAuthHeaders } from "../../DataController";

interface DatasetEditorQueryPanelProps {
    datasetVisible: boolean;
    toggleDatasetVisible: any;
}

export const DatasetEditorQueryPanel = (props: DatasetEditorQueryPanelProps) => {
    const { controller, instance: dataset } = useContext<any>(DatasetController);

    const addQueryCriterion = () => {
        let currentFilters = dataset.query?.filters || [];
        let defaultQueryCriterion = {
            field: filterableFields?.[0].field,
            operator: null,
            value: null,
        };
        currentFilters.push(JSON.parse(JSON.stringify(defaultQueryCriterion)));
        controller.setProperty("query.filters", currentFilters);
    };

    let [lastTimer, setLastTimer] = useState<any | undefined>(undefined);
    // we will fetch the set of query endpoints from the API.
    // we also need to track its loading state.
    let [queryEndpointsLoading, setQueryEndpointsLoading] = useState<boolean>(true);
    let [queryEndpoints, setQueryEndpoints] = useState<any | undefined>(undefined);
    // we will fetch the currently-selected queryEndpoint from the API.
    // we also need to track a loading state for it.
    let [filterableFieldsLoading, setFilterableFieldsLoading] = useState<boolean>(true);
    let [filterableFields, setFilterableFields] = useState<any[] | undefined>(undefined);
    // close around 'idx' to persist the index in the filters array as we
    // 'map' below.
    const setCriterion = (idx: number) => {
        // the actual setter, takes "newCriterion"
        function setNewCriterion(newCriterion: any) {
            controller.setProperty(`query.filters[${idx}]`, newCriterion);
        }
        // the return function. It sets the lastTimeout, but first clears it if
        // one is active, creating a debounce.
        return (newCriterion: any) => {
            clearTimeout(lastTimer);
            // set debounce period of DEFAULT_INPUT_DEBOUNCE (as of writing: 1s)
            lastTimer = setTimeout(setNewCriterion, DEFAULT_INPUT_DEBOUNCE * 1000, newCriterion);
            setLastTimer(lastTimer);
        };
    };
    const deleteCriterion = (idx: number) => {
        return function doDelete() {
            controller.setProperty(`query.filters[${idx}]`, null);
            /* But why not do this?
            //let splicedFilters = dataset.query.filters;
            //splicedFilters.splice(idx, 1);
            //controller.setProperty("query.filters", [...splicedFilters]);
            // because react of course! Stupid bug somewhere related to key!
            */
        };
    };
    const setEndpoint = (event: any) => {
        let endpoint = event.target.value;
        controller.setProperty(`query.endpoint`, endpoint);
        controller.setProperty("query.filters", []);
    };

    useEffect(() => {
        setQueryEndpointsLoading(true);
        let apiUrl = `${API_URL}/datasources/`;
        let headers = {
            "Content-Type": "application/json",
        } as any;
        headers = setAuthHeaders(headers);
        fetch(apiUrl, {
            headers: headers,
            method: "GET",
        }).then(function (response) {
            if (response.ok) {
                response.json().then((output) => {
                    setQueryEndpoints(output);
                    setQueryEndpointsLoading(false);
                });
            }
        });
    }, []);

    const fetchFilterableFields = () => {
        setFilterableFieldsLoading(true);
        if (!queryEndpoints) return;
        let queryEndpointMetadata = queryEndpoints[controller.instance.query.endpoint];
        // if this endpoint requires a variable, but we don't have a value for it, return.
        let filterableFieldsUrl = queryEndpointMetadata?.["filterable_columns_endpoint"];
        if (!filterableFieldsUrl) return;
        let apiUrl = `${API_URL}${filterableFieldsUrl}`;
        let headers = {
            "Content-Type": "application/json",
        } as any;
        headers = setAuthHeaders(headers);
        fetch(apiUrl, {
            headers: headers,
            method: "GET",
        }).then(function (response) {
            if (response.ok) {
                response.json().then((output) => {
                    setFilterableFields(output);
                    setFilterableFieldsLoading(false);
                });
            }
        });
    };

    useEffect(fetchFilterableFields, [queryEndpoints, controller.instance?.query?.endpoint]);

    return (
        <ContentAccordion
            header="Query"
            footer="&nbsp;"
            visibility={props.datasetVisible}
            setVisibilityToggle={props.toggleDatasetVisible}
            showEye={true}
        >
            {queryEndpointsLoading ? (
                <label>Loading Datasource Metadata...</label>
            ) : (
                <div role="form" key={quickhash(JSON.stringify(controller.instance.query.filters))}>
                    <div className="mb-4">
                        <select
                            onChange={setEndpoint}
                            id="dataset-selector"
                            value={controller.instance.query.endpoint}
                        >
                            {Object.keys(queryEndpoints).map((name) => {
                                let endpoint = queryEndpoints[name];
                                return <option value={name}>{endpoint.display_name}</option>;
                            })}
                        </select>
                        &nbsp;where&hellip;
                    </div>
                    {controller.instance?.query?.filters.map((criterion: any, idx: number) => {
                        return (
                            <QueryCriterion
                                prevCriteria={controller.instance.query.filters.slice(0, idx)}
                                endpoint={controller.instance.query.endpoint}
                                criterion={criterion}
                                setCriterion={setCriterion(idx)}
                                deleteCriterion={deleteCriterion(idx)}
                                filterableFields={filterableFields}
                                queryEndpoints={queryEndpoints}
                                key={`${idx}`}
                            />
                        );
                    })}
                    <Icon
                        id="add-query-criterion"
                        name="plus"
                        className="btn icon bordered -mt-0.5"
                        onClick={addQueryCriterion}
                    />
                </div>
            )}
        </ContentAccordion>
    );
};
