import { useState } from "react";
import { Icon } from "./Icon.component";
import { text2clipboard } from "./datasetEditor/util/callbacks";
import { TOOLTIP_TTL } from "../../static/settings";

export interface ClipboardCopyInputProps {
    iconName: string;
    copyValue: string;
    title?: string;
    buttonProps?: { [buttonAttrKey: string]: any };
}

/**
 * Renders a readonly input action button control.
 *
 * @param {ClipboardCopyInputProps} props
 * @prop {string} iconName                            Set the Lucide icon name for the button control.
 * @prop {string} copyValue                                 Set the value to be copied.
 * @prop {string} title                               Optional. Set the title property.
 * @prop {{[buttonAttrKey: string]: any}} buttonProps Optional. Sets any additional props for the button control.
 * @see /terranova/frontend/src/components/common/constants
 * @returns
 */
export const CopyIconButton = (props: ClipboardCopyInputProps) => {
    const { buttonProps } = props;

    const [showTooltip, setShowTooltip] = useState(false);

    let clickHandler = buttonProps?.onClick;
    if (!clickHandler) {
        clickHandler = () => {
            text2clipboard(props.copyValue);
            setShowTooltip(true);
            setTimeout(() => {
                setShowTooltip(false);
            }, TOOLTIP_TTL * 1000);
        };
    }

    return (
        <div>
            <div title={props.title}>
                <Icon name={props.iconName} className="icon btn bordered" onClick={clickHandler} />
            </div>
            <div className="absolute mt-1">
                {showTooltip ? (
                    <span className={`tooltip-box copied-tooltip-box animate-fade opacity-0`}>
                        Copied!
                    </span>
                ) : null}
            </div>
        </div>
    );
};
