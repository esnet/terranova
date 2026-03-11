import React, { useState, useEffect } from "react";
import { Icon } from "./Icon.component";
import { Eye, EyeOff } from "lucide-react";
import { ESAccordion, ESButton } from "@esnet/packets-ui";

interface AccordionProps {
    header: string;
    footer?: string | boolean;
    children: React.ReactNode;
    showEye?: boolean;
    defaultVisibility?: boolean;
    onVisibilityChange?: (visible: boolean) => void;
}

/**
 * TODO: Modify PktsAccordion header/footer prop to accept React Nodes
 * TODO: Manually override button style to remove min-height and add delete button to footer
 */
export function Accordion({
    showEye = false,
    defaultVisibility,
    onVisibilityChange,
    header,
    footer = true,
    children,
}: AccordionProps) {
    const [visible, setVisible] = useState(defaultVisibility ?? false);
    const toggleVisibility = () =>
        setVisible((prev) => {
            onVisibilityChange?.(!prev);
            return !prev;
        });

    const eyeButton = showEye ? (
        <button className="cursor-pointer" onClick={toggleVisibility}>
            {visible ? <Eye /> : <EyeOff />}
        </button>
    ) : undefined;

    return (
        <ESAccordion header={header} footer={footer} actionButtons={eyeButton}>
            {children}
        </ESAccordion>
    );
}
