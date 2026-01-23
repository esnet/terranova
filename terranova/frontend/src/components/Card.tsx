import React from "react";

type CardProps = {
    icon?: React.ReactElement;
    /** Header text. */
    header: React.ReactNode;
    /** If specified, append this element on the same visual row level as the header. Useful for "new <thing>" buttons */
    headerButton?: React.ReactElement;
    /** Textual content of the card */
    children: React.ReactNode;
};

function Card({ icon, header, headerButton, children }: CardProps) {
    return (
        <div className="surface p-6 rounded-2xl border border-dotted">
            <div className="flex flex-row space-between">
                <h3 className="flex flex-row items-center gap-3 text-light-primary">
                    {icon && <div className="min-w-fit min-h-fit">{icon}</div>}
                    {header}
                </h3>
                {headerButton && headerButton}
            </div>
            {children}
        </div>
    );
}

export default Card;
