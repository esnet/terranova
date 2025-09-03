import { useState } from "react";

export function FocusTextArea(props: any) {
    const [rows, setRows] = useState(1);
    const [internalValue, setInternalValue] = useState(props.value);
    const [customClasses, setCustomClasses] = useState("");
    const [invalidMessage, setInvalidMessage] = useState(null);
    const doFocus = (ev: any) => {
        setRows(8);
        if (!invalidMessage) {
            setInternalValue(JSON.stringify(JSON.parse(props.value), null, "  "));
        }
    };
    const doBlur = (ev: any) => {
        setRows(1);
        if (!invalidMessage) {
            setInternalValue(props.value);
        }
    };
    const doChange = (ev: any) => {
        setInternalValue(ev.target.value);
        try {
            JSON.parse(ev.target.value);
            setCustomClasses("");
            setInvalidMessage(null);
            props.onChange(ev);
        } catch (e) {
            setCustomClasses(" invalid");
            setInvalidMessage(props.invalidMessage || "Invalid JSON");
        }
    };
    const renderInvalidMessage = () => {
        if (invalidMessage) {
            return <label className="invalid">{invalidMessage}</label>;
        }
        return null;
    };
    return (
        <>
            <textarea
                {...props}
                className={props.className + " font-mono py-1 resize-none" + customClasses}
                rows={rows}
                onBlur={doBlur}
                onFocus={doFocus}
                value={internalValue}
                onChange={doChange}
            ></textarea>
            {renderInvalidMessage()}
        </>
    );
}
