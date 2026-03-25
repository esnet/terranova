/**
 * TODO: This component should be ported to Packets Design System.
 * I've confined all relevant code and styling into this file.
 *
 * The styling isn't fully harmonious with Packets-esque styling.
 */

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { PktsInputText } from "@esnet/packets-ui-react";

export interface InputCopyProps extends React.ComponentPropsWithRef<"input"> {}

/**
 * Renders an input with an integrated copy-to-clipboard button. The input is read-only by default.
 */
export const InputCopy = ({ value, defaultValue, readOnly = true, ...props }: InputCopyProps) => {
    const [copied, setCopied] = useState(false);

    const onClickCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        const textToCopy = (value ?? defaultValue ?? "").toString();

        try {
            await navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => {
                setCopied(false);
            }, 2000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    };

    return (
        <PktsInputText
            readOnly={readOnly}
            actionButtons={
                <button
                    type="button"
                    onClick={onClickCopy}
                    tabIndex={0}
                    className="cursor-pointer outline-none text-light-copyAlt hover:text-light-copy transition-colors duration-300 focus:border-y border-t-transparent box-content"
                    aria-label="Copy to clipboard"
                >
                    {copied ? <Check className="" /> : <Copy className="" />}
                </button>
            }
            value={value}
            defaultValue={defaultValue}
            {...props}
        />
    );
};
