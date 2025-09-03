import { ContentAccordion } from "./ContentAccordion.component";
import { Icon } from "./Icon.component";

interface ModalDialogProps {
    visible: boolean;
    dismiss: any;
    children: any;
    header: any;
    footer: any;
    className?: string;
}

export const ModalDialog = (props: ModalDialogProps) => {
    if (!props.visible) return <></>;

    return (
        <div
            className="modal-background"
            onClick={(e) => {
                props.dismiss();
            }}
        >
            <div
                className={props.className || "modal-dialog"}
                onClick={(e) => {
                    e.stopPropagation();
                }}
            >
                <div className="panel-header compound justify">
                    <div className="compound w-full">
                        {props.header}
                        <div onClick={props.dismiss}>
                            <Icon
                                name="x-circle"
                                className="icon btn p-1 stroke-esnetblue-100"
                            ></Icon>
                        </div>
                    </div>
                </div>
                <div className="panel-body">
                    <div className="w-full">{props.children}</div>
                </div>
                <div className="panel-footer">
                    <div className="flex flex-row w-full justify-between">{props.footer}</div>
                </div>
            </div>
        </div>
    );
};
