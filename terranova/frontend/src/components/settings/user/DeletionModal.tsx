import { PktsButton } from "@esnet/packets-ui-react";
import { Trash2, X } from "lucide-react";
import { ModalDialog } from "../../ModalDialog";

type Props = {
    visible: boolean;
    close: any;
    confirmDeleteUser: any;
    user: any;
};

const DeletionModal = ({ visible, close, confirmDeleteUser, user }: Props) => {
    let footer = (
        <div className="flex justify-end gap-2 w-full">
            <PktsButton variant="secondary" onClick={close}>
                <span className="flex items-center gap-2">
                    <X /> Cancel
                </span>
            </PktsButton>

            <PktsButton variant="destructive" onClick={confirmDeleteUser}>
                <span className="flex items-center gap-2">
                    <Trash2 /> Confirm Deletion
                </span>
            </PktsButton>
        </div>
    );
    return (
        <ModalDialog
            visible={visible}
            setVisible={close}
            header={"Confirm Deletion"}
            footer={footer}
        >
            <h5>Are You Sure?</h5>
            <div>
                Please confirm deletion for user:{" "}
                <b>
                    {user?.name ?? <i>No given name</i>}:&nbsp;'
                    {user?.username ?? <i>No given username</i>}'
                </b>
            </div>
        </ModalDialog>
    );
};

export default DeletionModal;
