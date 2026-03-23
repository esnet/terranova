/**
 * TODO: This component should be ported to Packets Design System.
 * I've confined all relevant code and styling into this file.
 *
 * The styling isn't fully harmonious with Packets-esque styling.
 */
import React, { ChangeEvent, ComponentPropsWithRef, useState } from "react";

interface InputColorProps extends ComponentPropsWithRef<"input"> {}

function InputColor({ value, onChange, defaultValue, className, ...props }: InputColorProps) {
    // switch to useControllableState when porting to Packets
    let [_value, setValue] = useState(defaultValue);

    const _onChange = (event: ChangeEvent<HTMLInputElement>) => {
        setValue(event.target.value);
        onChange?.(event);
    };

    return (
        <input
            {...props}
            type="color"
            className={`w-full h-11.75 -mt-1 -mb-[4.5px] appearance-none p-0 border-none cursor-pointer ${className ? className : ""}`}
            onChange={_onChange}
            value={value ?? _value}
        />
    );
}

export default InputColor;
