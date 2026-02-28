import React, { useState, useEffect } from "react";
import { Icon } from "./Icon.component";
import { Eye, EyeOff } from "lucide-react";
import { ESAccordion } from "@esnet/packets-ui";

interface AccordionProps {
    header: string;
    children: React.ReactNode;
    showEye?: boolean;
    defaultVisibility?: boolean;
    onVisibilityChange?: (visible: boolean) => void;
}

export function Accordion({
    showEye = false,
    defaultVisibility,
    onVisibilityChange,
    header,
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
        <ESAccordion header={header} footer actionButtons={eyeButton}>
            {children}
        </ESAccordion>
    );
}
