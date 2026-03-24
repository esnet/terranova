import { useState, useEffect } from "react";
import { NODE_GROUP_FIELDS } from "../../../data/constants";
import { PktsInputOption, PktsInputSelect } from "@esnet/packets-ui-react";
import { quickhash } from "../../../data/utils";

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
                        <PktsInputSelect
                            key={`criterion-${idx}-${value}`}
                            defaultValue={value}
                            onChange={(e) => {
                                props.setCriterion(idx, e.target.value);
                            }}
                        >
                            {NODE_GROUP_FIELDS[props.endpoint]?.map((item, index) => {
                                return (
                                    <PktsInputOption key={`option-${index}`} value={item.value}>
                                        {item.label}
                                    </PktsInputOption>
                                );
                            })}
                        </PktsInputSelect>
                        <label className="block">Then Group On:</label>
                    </span>
                );
            })}
            <PktsInputSelect
                key={quickhash(JSON.stringify(props.criteria))}
                onChange={(e) => {
                    props.setCriterion(
                        (props.criteria && props.criteria?.length) || 0,
                        e.target.value,
                    );
                }}
                value={undefined}
            >
                {NODE_GROUP_FIELDS[props.endpoint]?.map((item, index) => {
                    return (
                        <PktsInputOption key={`option-${index}`} value={item.value}>
                            {item.label}
                        </PktsInputOption>
                    );
                })}
            </PktsInputSelect>
        </>
    );
};
