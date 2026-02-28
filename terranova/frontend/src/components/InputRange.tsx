/**
 * This component should be ported to Packets Design System.
 * I've confined all relevant code and styling into this file.
 */
import { ChangeEvent, ComponentPropsWithRef, useState } from "react";

interface InputRangeProps extends ComponentPropsWithRef<"input"> {
    showNumber?: boolean;
}
export function InputRange({
    value,
    onChange,
    defaultValue,
    className,
    showNumber = true,
    ...props
}: InputRangeProps) {
    // switch to useControllableState when porting to Packets
    let [_value, setValue] = useState(defaultValue);

    const _onChange = (event: ChangeEvent<HTMLInputElement>) => {
        setValue(event.target.value);
        onChange?.(event);
    };

    return (
        <div className="w-full flex h-9 items-center">
            <input
                type="range"
                name={props.name}
                className="w-full p-px cursor-pointer appearance-none rounded-full my-auto border border-core-slate-900 bg-core-white-100 accent-light-primary"
                value={value ?? _value}
                onChange={_onChange}
                {...props}
            />
            {showNumber && <span className="w-12 text-right">{value ?? _value}</span>}
        </div>
    );
}
