import { useState, useEffect } from "react";
import { Icon } from "./Icon.component";

interface HeaderProps {
    showEye: boolean;
    visibility: boolean;
    header: any;
    footer: any;
    children: any;
    setVisibilityToggle?: any;
    isOpen?: boolean;
}

export function ContentAccordion(props: HeaderProps) {
    const [isOpen, setIsOpen] = useState(props.hasOwnProperty("isOpen") ? props.isOpen : true);
    const [chevron, setChevron] = useState(isOpen ? "chevron-down" : "chevron-right");
    const [eyeIcon, setEyeIcon] = useState(props.visibility ? "eye" : "eye-off");

    let eyeIconPlaceholder;
    if (props.showEye) {
        eyeIconPlaceholder = (
            <div className="icon btn sm p-1 float-right" onClick={toggleEye}>
                <Icon name={eyeIcon} className="stroke-esnetblue-100 -mt-1 -ml-1"></Icon>
            </div>
        );
    } else {
        eyeIconPlaceholder = null;
    }

    function toggle() {
        if (chevron == "chevron-down") {
            setChevron("chevron-right");
            setIsOpen(false);
        } else {
            setChevron("chevron-down");
            setIsOpen(true);
        }
    }

    function toggleEye() {
        if (eyeIcon == "eye") {
            setEyeIcon("eye-off");
            if (props.setVisibilityToggle) {
                props?.setVisibilityToggle(false);
            }
        } else {
            setEyeIcon("eye");
            if (props.setVisibilityToggle) {
                props?.setVisibilityToggle(true);
            }
        }
    }

    return (
        <div>
            <div
                className={
                    isOpen
                        ? "panel-header compound justify"
                        : "panel-header compound justify rounded-b-xl"
                }
            >
                <div className="compound">
                    <div onClick={toggle}>
                        <Icon
                            name={chevron}
                            className="icon btn sm p-1 mr-2 stroke-esnetblue-100"
                        ></Icon>
                    </div>
                    {props.header}
                </div>
                {eyeIconPlaceholder}
            </div>
            <div className="panel-body" hidden={!isOpen}>
                <div className="w-full">{props.children}</div>
            </div>
            <div className="panel-footer" hidden={!isOpen}>
                <div className="flex flex-row w-full justify-between">{props.footer}</div>
            </div>
        </div>
    );
}
