import React from "react";

type CardProps = {
    icon?: React.ReactElement;
    /** Header text. */
    header?: React.ReactNode;
    /** If specified, append this element on the same visual row level as the header. Useful for "new <thing>" buttons */
    headerButton?: React.ReactElement;
    /** Textual content of the card */
    children: React.ReactNode;
    /** Additional utility class stylings. */
    className?: string;
};

/**
 * Custom Terranova dotted border card.
 */
function Card({ icon, header, headerButton, children, className = "" }: CardProps) {
    return (
        <div className={`surface p-4 rounded-2xl border border-dotted h-fit ${className}`}>
            {header && (
                <div className="flex flex-row space-between mb-1">
                    <h5 className="flex flex-row items-center gap-3 text-light-primary">
                        {icon && <div className="min-w-fit min-h-fit">{icon}</div>}
                        {header}
                    </h5>
                    {headerButton && headerButton}
                </div>
            )}
            {children}
        </div>
    );
}

export default Card;
