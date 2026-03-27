/**
 * TODO: This component should be ported to Packets Design System - but utilizing HTML's dialog component.
 * I've confined all relevant code and styling into this file.
 * The styling isn't fully harmonious with Packets-esque styling.
 */
import React from "react";
import { XCircle } from "lucide-react";

// props should be modified to extend <dialog /> props
interface ModalDialogProps {
    visible: boolean;
    setVisible?: React.Dispatch<React.SetStateAction<boolean>>;
    children: React.ReactNode;
    header?: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
}

export const ModalDialog = ({
    visible,
    setVisible,
    children,
    header,
    footer,
    className,
}: ModalDialogProps) => {
    if (!visible) return <></>;

    return (
        <div
            className="fixed w-screen h-screen grid place-items-center inset-0 bg-core-black-900/40 z-1000"
            // dismiss modal when clicking on background
            onClick={() => setVisible?.(false)}
        >
            <div
                className="w-1/2 min-w-96 overflow-hidden rounded-xl"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                // change this when porting to packets to be a prop or similar
                aria-label="confirmation-modal"
                tabIndex={-1}
            >
                <div className="flex justify-between items-center grow w-full px-3 py-2 bg-light-secondary text-white">
                    <span className="w-full text-lg truncate text-inherit">{header}</span>
                    <XCircle
                        className="hover:cursor-pointer hover:text-white/75 transition"
                        onClick={() => setVisible?.(false)}
                    />
                </div>
                <div className={`w-full p-4 bg-light-surface_2 ${className ?? ""}`}>{children}</div>
                {/* same slate color as accordion component */}
                <div className="w-full p-2 bg-[#6a6e7a] min-h-10">{footer}</div>
            </div>
        </div>
    );
};
