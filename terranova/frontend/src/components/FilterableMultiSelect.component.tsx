import { useState, useEffect } from "react";

export function FilterableMultiSelect(props: any) {
    let [filterValue, setFilterValue] = useState("");
    let [lastManualFilterValue, setLastManualFilterValue] = useState("");
    // we need refs to both elements to determine if either is focused
    let [filterFocused, setFilterFocus] = useState(false);
    let [selectFocused, setSelectFocus] = useState(false);

    function doFocus(item: string) {
        return () => {
            if (item == "filter") {
                setFilterFocus(true);
            }
            if (item == "select") {
                setSelectFocus(true);
            }
        };
    }
    function doBlur(item: string) {
        return () => {
            if (item == "filter") {
                setFilterFocus(false);
            }
            if (item == "select") {
                setSelectFocus(false);
            }
        };
    }
    function setFilterValueFromValues() {
        setFilterValue(props.values?.join(" + ") || "");
    }

    useEffect(() => {
        if (filterFocused || selectFocused) {
            setFilterValue(lastManualFilterValue || "");
        } else {
            setFilterValueFromValues();
        }
    }, [filterFocused, selectFocused, props.values]);
    // every time props.values changes, do a blur check. If blurred, set the filter val.

    function doFilter(item: string) {
        return (
            filterValue === "" ||
            item?.toLocaleLowerCase().indexOf(filterValue?.toLocaleLowerCase()) >= 0
        );
    }
    return (
        <div className="searchable-multiselect">
            <input
                type="search"
                className="target-search"
                placeholder={props.placeholder}
                onChange={(e) => {
                    setLastManualFilterValue((e.target as HTMLInputElement).value);
                    setFilterValue((e.target as HTMLInputElement).value);
                }}
                onFocus={doFocus("filter")}
                onBlur={doBlur("filter")}
                value={filterValue}
            />
            <select
                multiple
                className="
                targets
                border-2-esnetgrey-500
                rounded
                border-esnetgrey-500
                bg-white
            "
                role="listbox"
                onChange={props.onChange}
                size={props?.items?.filter(doFilter).length || 0}
                onFocus={doFocus("select")}
                onBlur={doBlur("select")}
            >
                {props?.items?.filter(doFilter).map((item: any) => {
                    return (
                        <option
                            role="option"
                            aria-multiselectable={true}
                            key={item}
                            value={item}
                            selected={props?.values?.includes(item)}
                        >
                            {item}
                        </option>
                    );
                })}
            </select>
        </div>
    );
}
