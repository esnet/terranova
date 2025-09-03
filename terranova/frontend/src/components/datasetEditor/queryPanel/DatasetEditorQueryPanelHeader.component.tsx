import { Ref, useEffect, useRef, useState } from "react";
import { Icon } from "../../Icon.component";

export interface IDatasetEditorQueryPanelHeaderProps {
    onExpandToggle: (isExpanded: boolean) => void;
    onHideToggle: (isHidden: boolean) => void;
}

export const DatasetEditorQueryPanelHeader = ({
    onExpandToggle,
    onHideToggle,
}: IDatasetEditorQueryPanelHeaderProps) => {
    const toggleExpandRef: Ref<HTMLDivElement> = useRef(null);

    const toggleHideRef: Ref<HTMLDivElement> = useRef(null);

    const [isChevronIconOn, setIsChevronIconOn] = useState(false);
    const [isEyeIconOff, setIsEyeIconOff] = useState(false);

    const onExpandClick = () => {
        if (toggleExpandRef.current) {
            toggleExpandRef.current.focus();
        }
        setIsChevronIconOn(!isChevronIconOn);
    };

    const onHideClick = () => {
        if (toggleHideRef.current) {
            toggleHideRef.current.focus();
        }
        setIsEyeIconOff(!isEyeIconOff);
    };

    useEffect(() => {
        onExpandToggle(isChevronIconOn);
    }, [isChevronIconOn]);
    useEffect(() => {
        onHideToggle(isEyeIconOff);
    }, [isEyeIconOff]);

    const getChevronIcon = () => {
        if (isChevronIconOn) {
            return (
                <Icon
                    name="chevron-down"
                    className="chevron-down lucide-chevron-down -mt-1.5 -ml-1"
                />
            );
        } else {
            return (
                <Icon
                    name="chevron-right"
                    className="chevron-right lucide-chevron-right -mt-1.5 -ml-1"
                />
            );
        }
    };

    const getEyeIcon = () => {
        if (isEyeIconOff) {
            return <Icon name="eye-off" className="eye-off lucide-eye-off -mt-1.5 -ml-1" />;
        } else {
            return <Icon name="eye" className="eye lucide-eye -mt-1.5 -ml-1" />;
        }
    };

    return (
        <>
            <div ref={toggleExpandRef} className="compound" onClick={onExpandClick}>
                <div
                    className={`icon btn toggle sm p-1 mr-2`}
                    tabIndex={1}
                    role="button"
                    aria-pressed={isChevronIconOn}
                    aria-expanded={isChevronIconOn}
                >
                    {getChevronIcon()}
                </div>
                Query
            </div>
            <div
                ref={toggleHideRef}
                tabIndex={1}
                className={`icon btn toggle sm p-1 float-right`}
                onClick={onHideClick}
                role="button"
                aria-pressed={!isEyeIconOff}
            >
                {getEyeIcon()}
            </div>
        </>
    );
};
