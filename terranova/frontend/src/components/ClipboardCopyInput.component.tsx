import { useRef, useState } from "react";
import { Icon } from "./Icon.component";
import { text2clipboard } from "./datasetEditor/util/callbacks";
import { TOOLTIP_TTL } from "../../static/settings";

export interface ClipboardCopyInputProps {
    id?: string;
    defaultValue?: string;
    iconName?: string;
    label?: string;
    inputProps?: { [inputAttrKey: string]: any };
    buttonProps?: { [buttonAttrKey: string]: any };
}

/**
 * Renders a readonly input action button control.
 *
 * @param {ClipboardCopyInputProps} props
 * @prop {string} id                                  Optional. Sets the ID for the input field.
 * @prop {string} defaultValue                        Optional. Sets the default value for the input field.
 * @prop {string} iconName                            Optional. Set the Lucide icon name for the button control.
 *                                                      Defaults to DEFAULT_SVG_ICON.
 * @prop {string} label                               Optional. Set a label mapped to the input field.
 * @prop {{[inputAttrKey: string]: any}} inputProps   Optional. Sets any additional props for the input field.
 * @prop {{[buttonAttrKey: string]: any}} buttonProps Optional. Sets any additional props for the button control.
 * @see /terranova/frontend/src/components/common/constants
 * @returns
 */
export const ClipboardCopyInput = (props: ClipboardCopyInputProps) => {
    const { id, buttonProps, inputProps, label } = props;

    const [showTooltip, setShowTooltip] = useState(false);
    const inputRef: React.RefObject<HTMLInputElement> = useRef(null);

    let labelMarkup = null;
    if (label) {
        labelMarkup = <label htmlFor={id}>{label}:</label>;
    }

    let clickHandler = buttonProps?.onClick;
    if (!clickHandler) {
        clickHandler = () => {
            text2clipboard((inputRef.current as HTMLInputElement).value);
            setShowTooltip(true);
            setTimeout(() => {
                setShowTooltip(false);
            }, TOOLTIP_TTL * 1000);
        };
    }

    return (
        <>
            <div className="compound">
                {labelMarkup}
                {showTooltip ? (
                    <span className={`tooltip-box copied-tooltip-box animate-fade opacity-0`}>
                        Copied!
                    </span>
                ) : null}
            </div>
            <div className="clipboard-copy-input">
                <div className="input-container">
                    <input
                        id={id}
                        type="url"
                        ref={inputRef}
                        readOnly
                        {...inputProps}
                        value={props.defaultValue}
                    />
                    <button
                        role="button"
                        className={`
                            action-realtime-dataset-url-btn
                            primary
                        `}
                        {...buttonProps}
                        onClick={clickHandler}
                    >
                        <Icon name={props.iconName} />
                    </button>
                </div>
            </div>
        </>
    );
};
