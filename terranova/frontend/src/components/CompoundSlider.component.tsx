import { useState } from "react";

export function CompoundSlider(props: any) {
    let [val, setVal] = useState(props.value || props.defaultValue);

    function onChange(event: any) {
        setVal(event.target.value);
        props?.onChange(event);
    }

    return (
        <div className={props.className ? props.className : "compound"}>
            <input
                type="range"
                name={props.name}
                className="w-9/12"
                value={val}
                min={props.min}
                max={props.max}
                step={props.step}
                onChange={onChange}
            />
            <input type="text" className="w-2/12" value={val} onChange={onChange} />
        </div>
    );
}
