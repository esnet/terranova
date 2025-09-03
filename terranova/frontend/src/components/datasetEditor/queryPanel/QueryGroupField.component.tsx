import { useState, useEffect } from "react";
import { NODE_GROUP_FIELDS } from "../../../data/constants";

interface QueryGroupFieldProps {
    criteria: any[];
    setCriterion: any;
    endpoint: string;
}

export const QueryGroupField = (props: QueryGroupFieldProps) => {
    return (
        <>
            {props.criteria?.map((value, idx) => {
                return (
                    <span key={`span-criterion-${idx}-${value}`}>
                        <select
                            key={`criterion-${idx}-${value}`}
                            defaultValue={value}
                            onChange={(e) => {
                                props.setCriterion(idx, e.target.value);
                            }}
                        >
                            <option key="option-null" value="">
                                --
                            </option>
                            {NODE_GROUP_FIELDS[props.endpoint]?.map((item, index) => {
                                return (
                                    <option key={`option-${index}`} value={item.value}>
                                        {item.label}
                                    </option>
                                );
                            })}
                        </select>
                        <label className="block">Then Group On:</label>
                    </span>
                );
            })}
            <select
                key={`criterion-new`}
                defaultValue={undefined}
                onChange={(e) => {
                    props.setCriterion(
                        (props.criteria && props.criteria?.length) || 0,
                        e.target.value
                    );
                    e.target.value = "";
                }}
            >
                <option key="option-null" value="">
                    --
                </option>
                {NODE_GROUP_FIELDS[props.endpoint]?.map((item, index) => {
                    return (
                        <option key={`option-${index}`} value={item.value}>
                            {item.label}
                        </option>
                    );
                })}
            </select>
        </>
    );
};
