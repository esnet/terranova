import { useState, useEffect } from "react";
import { Icon } from "../../Icon.component";
import { FilterableMultiSelect } from "../../FilterableMultiSelect.component";
import { setAuthHeaders } from "../../../DataController";
import { useAuth } from "../../../AuthService";
import { INPUT_MODIFIER_OPTIONS } from "../../../data/constants";
import { quickhash } from "../../../data/utils";
import { API_URL, CACHE_DURATION_IN_SECONDS } from "../../../../static/settings";

interface QueryCriterionProps {
    prevCriteria: any[];
    criterion: any;
    endpoint: string;
    setCriterion: any;
    deleteCriterion: any;
    filterableFields: any;
    queryEndpoints: any;
}

export const QueryCriterion = (props: QueryCriterionProps) => {
    if (!props.criterion) return <></>;
    const auth = useAuth();

    var [filterResults, setFilterResults] = useState<any[] | null>(null);
    var [filterableFieldHash, setFilterableFieldHash] = useState<any | null>(null);

    useEffect(() => {
        let h = {};
        if (props.filterableFields?.map) {
            props.filterableFields.map((f: any) => {
                // @ts-ignore
                h[f.field] = f;
            });
        }
        setFilterableFieldHash(h);
    }, [props.filterableFields]);

    function composeFilters(filters: any, filterStr: string) {
        for (let i = 0; i < filters.length; i++) {
            for (let j = 0; j < filters[i]?.["value"]?.length; j++) {
                let fieldExt = "";
                if (filters[i]["operator"]) {
                    fieldExt = "_" + filters[i]["operator"];
                }
                filterStr += `${filters[i]["field"]}${fieldExt}=${filters[i]["value"][j]}&`;
            }
        }
        return filterStr;
    }

    async function fetchColumnMatches(column: string) {
        let timePrecisionKeyPart = (Date.now() / 1000 / CACHE_DURATION_IN_SECONDS).toFixed(0);
        let filters = JSON.parse(JSON.stringify(props.prevCriteria));
        filters.push(props.criterion);
        let endpoint = props.queryEndpoints[props.endpoint]?.distinct_values_endpoint;
        if (!endpoint) return;
        let hash = quickhash(endpoint + JSON.stringify(filters));
        let cacheKey = `ColumnMatches.${hash}.${timePrecisionKeyPart}`;
        let hit = localStorage.getItem(cacheKey);
        if (hit) {
            filterResults = JSON.parse(hit);
        } else {
            let headers = {
                "Content-Type": "application/json",
            };
            headers = setAuthHeaders(headers);
            let filterStr = composeFilters(props.prevCriteria, "?");
            let fetchUrl = `${API_URL}${endpoint}/${column}/${filterStr}`;
            let response = await fetch(fetchUrl, { headers });
            if (response.ok) {
                filterResults = await response.json();
                localStorage.setItem(cacheKey, JSON.stringify(filterResults));
            }
        }
        setFilterResults(filterResults);
    }

    var [hitCount, setHitCount] = useState<string>("");

    async function fetchResultCount() {
        let filters = JSON.parse(JSON.stringify(props.prevCriteria));
        filters.push(props.criterion);
        if (!props.criterion?.value || !props?.criterion?.value?.length) {
            return;
        }
        let endpoint = props.queryEndpoints[props.endpoint]?.query_endpoint;
        let timePrecisionKeyPart = (Date.now() / 1000 / CACHE_DURATION_IN_SECONDS).toFixed(0);
        let hash = quickhash(endpoint + JSON.stringify(filters));
        let cacheKey = `ResultCount.${hash}.${timePrecisionKeyPart}`;
        let hit = localStorage.getItem(cacheKey);
        if (hit) {
            hitCount = hit;
        } else {
            let headers = {
                "Content-Type": "application/json",
            };
            headers = setAuthHeaders(headers);
            let filterStr = composeFilters(filters, "?limit=0&");
            var response = await fetch(`${API_URL}${endpoint}/${filterStr}`, {
                headers: headers,
            });
            if (response.ok) {
                hitCount = response.headers.get("x-result-count") || "";
                localStorage.setItem(cacheKey, hitCount);
            }
        }
        setHitCount(hitCount);
    }

    function set(field: string, value: string | any[]) {
        props.criterion[field] = value;
        props.setCriterion(props.criterion);
    }

    useEffect(() => {
        fetchColumnMatches(props.criterion.field);
        fetchResultCount();
    }, []);

    const [inputTextValue, setInputTextValue] = useState("");
    useEffect(() => {
        const lastHandle = setTimeout(() => {
            if (!inputTextValue) {
                return;
            }
            set("value", [inputTextValue]);
            fetchResultCount();
        }, 500);
        return () => clearTimeout(lastHandle);
    }, [inputTextValue]);

    return (
        <div
            className="
                compound-query-criterion
                flex
                justify-left
                items-start
                gap-2
                mb-4
            "
        >
            <Icon
                name="trash2"
                className="icon btn bordered w-9 h-9"
                onClick={props.deleteCriterion}
            />
            <select
                defaultValue={props.criterion.field}
                onChange={(e) => {
                    set("field", e.target.value);
                    fetchColumnMatches(e.target.value);
                    fetchResultCount();
                }}
            >
                {props.filterableFields?.map &&
                    props.filterableFields?.map(
                        ({ label, field }: { label: string; field: any }) => {
                            return (
                                <option key={field} value={field}>
                                    {label}
                                </option>
                            );
                        }
                    )}
            </select>
            <select
                defaultValue={props.criterion.operator}
                onChange={(e) => {
                    set("operator", e.target.value);
                    fetchResultCount();
                }}
            >
                {INPUT_MODIFIER_OPTIONS.map(({ label, value }) => {
                    return (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    );
                })}
            </select>
            {/* if 'operator' is not null, empty string, or "not_equal" */}
            {props.criterion.operator !== "" &&
            props.criterion.operator !== null &&
            props.criterion.operator !== "not_equal" ? (
                /* show a text box */
                <input
                    type="text"
                    defaultValue={props.criterion?.value?.[0]}
                    onChange={(e) => {
                        setInputTextValue(e.target.value);
                    }}
                />
            ) : (
                /* otherwise, we have a direct "eq" or "neq" operation. We'll want to show a filterable multi-select */
                <FilterableMultiSelect
                    items={filterResults}
                    placeholder={filterableFieldHash?.[props.criterion.field]?.["placeholder"]}
                    values={props.criterion.value}
                    onChange={(e: { target: { selectedOptions: any[] } }) => {
                        let newValue = Array.from(e.target.selectedOptions).map((e) => {
                            return e.value;
                        });
                        set("value", newValue);
                        fetchResultCount();
                    }}
                />
            )}
            <label className="text-pink-500" key="hitcount-${hitCount}">
                {(isNaN(parseFloat(hitCount)) && "...") || parseFloat(hitCount)}&nbsp;
                {parseFloat(hitCount) === 1 ? "circuit" : "circuits"}
            </label>
        </div>
    );
};
