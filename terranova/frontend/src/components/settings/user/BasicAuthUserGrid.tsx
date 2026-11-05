import * as React from "react";
import { setAuthHeaders } from "../../../DataController";
import {
    API_URL,
    READ_SCOPE,
    READ_WRITE_SCOPE,
    PUBLISH_SCOPE,
    ADMIN_SCOPE,
} from "../../../../static/settings";
import {
    PktsInputText,
    PktsInputSelect,
    PktsInputOption,
    PktsButton,
    PktsIconButton,
    PktsInputPassword,
} from "@esnet/packets-ui-react";
import {
    Hourglass,
    Check,
    X,
    Pencil,
    Trash2,
    UserCog,
    ChevronDown,
    ChevronLeft,
    CircleUser,
    Mail,
    KeyRound,
    FileEdit,
    Plus,
    Save,
} from "lucide-react";
import { Accordion } from "../../Accordion";
import DeletionModal from "./DeletionModal";

interface DeletionData {
    user: any;
    index: number;
}

export function BasicAuthUserGrid() {
    const [users, setUsers] = React.useState<any[]>([]);
    const [confirmDelete, setConfirmDelete] = React.useState<DeletionData | null>(null);
    const [loading, setLoading] = React.useState(true);

    async function fetchUsers() {
        let apiUrl = `${API_URL}/user/?limit=9999`;
        let headers = {
            "Content-Type": "application/json",
        } as any;
        headers = setAuthHeaders(headers);
        fetch(apiUrl, { headers: headers, method: "GET" }).then(function (response) {
            if (response.ok) {
                response.json().then((output) => {
                    setLoading(false);
                    setUsers(output);
                });
            }
        });
    }

    React.useEffect(() => {
        fetchUsers();
    }, []);

    const ROLES = {
        READ_ONLY: [READ_SCOPE],
        READ_WRITE: [READ_SCOPE, READ_WRITE_SCOPE],
        PUBLISHER: [READ_SCOPE, READ_WRITE_SCOPE, PUBLISH_SCOPE],
        ADMIN: [READ_SCOPE, READ_WRITE_SCOPE, PUBLISH_SCOPE, ADMIN_SCOPE],
    };

    function getRoleLabel(scope: any) {
        const strScope = JSON.stringify(scope);
        if (strScope === JSON.stringify(ROLES["READ_ONLY"])) return "Read-Only";
        if (strScope === JSON.stringify(ROLES["READ_WRITE"])) return "Read/Write";
        if (strScope === JSON.stringify(ROLES["PUBLISHER"])) return "Publisher";
        if (strScope === JSON.stringify(ROLES["ADMIN"])) return "Admin";
        return "Unknown Role";
    }

    function setPassword(user: any, idx: number) {
        function handler(event: any) {
            user._setPassword = true;
            users[idx] = user;
            setUsers([...users]);
        }
        return handler;
    }
    function cancelSetPassword(user: any, idx: number) {
        function handler(event: any) {
            user._setPassword = false;
            users[idx] = user;
            setUsers([...users]);
        }
        return handler;
    }
    function validateForm() {
        let formElem = document.getElementById(`table-form`) as HTMLFormElement;
        let valid = formElem?.checkValidity();
        if (!valid) {
            formElem?.reportValidity();
        }
        return !!valid;
    }
    function commitPassword(user: any, idx: number) {
        function handler(event: any) {
            if (!validateForm()) return;
            let apiUrl = `${API_URL}/user/${user.username}/set_password`;
            let headers = {
                "Content-Type": "application/json",
            } as any;
            headers = setAuthHeaders(headers);
            let payload = { password: user._newPassword };
            fetch(apiUrl, {
                headers: headers,
                method: "PUT",
                body: JSON.stringify(payload),
            }).then(function (response) {
                if (response.ok) {
                    response.json().then((output) => {
                        output._setPassword = false;
                        output._passwordReset = true;
                        users[idx] = output;
                        setUsers([...users]);
                        setTimeout(() => {
                            output._passwordReset = false;
                        }, 1000);
                    });
                }
            });
        }
        return handler;
    }
    function editUser(user: any, idx: number) {
        function handler(event: any) {
            user._edit = true;
            users[idx] = user;
            setUsers([...users]);
        }
        return handler;
    }
    function createUser(user: any, idx: number) {
        function handler(event: any) {
            if (!validateForm()) return;
            let apiUrl = `${API_URL}/user`;
            let headers = {
                "Content-Type": "application/json",
            } as any;
            headers = setAuthHeaders(headers);
            let payload = {
                username: user.username,
                password: user._newPassword,
                name: user.name,
                scope: user.scope,
            };
            fetch(apiUrl, {
                headers: headers,
                method: "POST",
                body: JSON.stringify(payload),
            }).then(function (response) {
                if (response.ok) {
                    response.json().then((output) => {
                        output._saved = true;
                        users[idx] = output;
                        setUsers([...users]);
                        setTimeout(() => {
                            output._saved = false;
                        }, 1000);
                    });
                }
            });
        }
        return handler;
    }
    function commitUser(user: any, idx: number) {
        function handler(event: any) {
            if (!validateForm()) return;
            let apiUrl = `${API_URL}/user/${user.username}/`;
            let headers = {
                "Content-Type": "application/json",
            } as any;
            headers = setAuthHeaders(headers);
            // based off of the UserUpdate in models.py
            const payload = {
                username: user.username,
                email: user.email,
                name: user.name,
                scope: user.scope,
            };
            fetch(apiUrl, {
                headers: headers,
                method: "PUT",
                body: JSON.stringify(payload),
            }).then(function (response) {
                if (response.ok) {
                    response.json().then((output) => {
                        output._edit = false;
                        output._saved = true;
                        users[idx] = output;
                        setUsers([...users]);
                        setTimeout(() => {
                            output._saved = false;
                        }, 1000);
                    });
                }
            });
        }
        return handler;
    }
    function cancelEditUser(user: any, idx: number) {
        function handler(event: any) {
            user._edit = false;
            users[idx] = user;
            setUsers([...users]);
        }
        return handler;
    }
    function deleteUser(user: any, idx: number) {
        function handler(event: any) {
            setConfirmDelete({ user: user, index: idx });
        }
        return handler;
    }
    function cancelDeleteUser() {
        setConfirmDelete(null);
    }
    function confirmDeleteUser() {
        if (!confirmDelete?.user) return;
        let apiUrl = `${API_URL}/user/${confirmDelete?.user?.username}/`;
        let headers = {
            "Content-Type": "application/json",
        } as any;
        headers = setAuthHeaders(headers);
        fetch(apiUrl, {
            headers: headers,
            method: "DELETE",
        }).then(function (response) {
            if (response.ok) {
                response.json().then((output) => {
                    users.splice(confirmDelete?.index, 1);
                    setUsers([...users]);
                    setConfirmDelete(null);
                });
            }
        });
    }
    function addUser() {
        let newUser = {
            _new: true,
            scope: ROLES["READ_ONLY"],
        };
        users.push(newUser);
        setUsers([...users]);
    }
    function cancelAddUser(user: any, idx: number) {
        function handler(event: any) {
            users.splice(idx, 1);
            setUsers([...users]);
        }
        return handler;
    }
    function setScopes(user: any, idx: number) {
        function handler(event: any) {
            let elem = event.target;
            user.scope = JSON.parse(elem.value);
            users[idx] = user;
            setUsers([...users]);
        }
        return handler;
    }
    function invalidMessage(msg: string | null) {
        function handler(e: any) {
            e.target.setCustomValidity(msg);
        }
        return handler;
    }
    function setUserPassword(user: any, idx: number) {
        function handler(e: any) {
            user._newPassword = e.target.value;
            if (e.target.value) {
                invalidMessage("")(e);
            }
        }
        return handler;
    }
    function setUserUsername(user: any, idx: number) {
        function handler(e: any) {
            user.username = e.target.value;
            if (e.target.value) {
                invalidMessage("")(e);
            }
        }
        return handler;
    }
    function setUserName(user: any, idx: number) {
        function handler(e: any) {
            user.name = e.target.value;
            if (e.target.value) {
                invalidMessage("")(e);
            }
        }
        return handler;
    }

    function renderUsersList() {
        return users.map((user, idx) => {
            return (
                <tr
                    className="border-b border-color-text"
                    key={`${user.username}-${idx}` || `new-user-${idx}`}
                >
                    <td className="p-2 max-w-64">
                        {user._edit || user._new ? (
                            <PktsInputText
                                defaultValue={user.name}
                                placeholder="Name"
                                required
                                name="name"
                                onChange={setUserName(user, idx)}
                                onInvalid={invalidMessage("Please enter the user's full name")}
                            />
                        ) : (
                            <div className="ml-1 truncate" title={user.name}>
                                {user.name}
                            </div>
                        )}
                    </td>
                    <td className="p-2 max-w-64">
                        {user._edit || user._new ? (
                            <PktsInputText
                                name="username"
                                // TODO: investigate and determine how basic auth should handle username vs email
                                // currently, removing the disabled and trying to modify the username fails w/ 422
                                disabled={user._edit}
                                defaultValue={user.username}
                                placeholder="Username"
                                required
                                onChange={setUserUsername(user, idx)}
                                onInvalid={invalidMessage(
                                    "Please enter the user's username or email address",
                                )}
                            />
                        ) : (
                            <div className="ml-1 truncate" title={user.username}>
                                {user.username}
                            </div>
                        )}
                    </td>
                    <td className="p-2 max-w-64">
                        <div className="relative w-full">
                            {user._new ? (
                                <PktsInputText
                                    type="password"
                                    name="password"
                                    placeholder="Password"
                                    defaultValue={user._newPassword}
                                    required
                                    onChange={setUserPassword(user, idx)}
                                    onInvalid={invalidMessage("Please enter a password")}
                                />
                            ) : user._setPassword ? (
                                <div className="compound flex flex-nowrap gap-2 items-center">
                                    <PktsInputPassword
                                        required
                                        name="password"
                                        defaultValue={user._newPassword}
                                        placeholder="Password"
                                        onChange={setUserPassword(user, idx)}
                                        onInvalid={invalidMessage("Please enter a password")}
                                    />
                                    <PktsIconButton
                                        disabled={loading}
                                        aria-label="Update password"
                                        onClick={commitPassword(user, idx)}
                                    >
                                        <Check />
                                    </PktsIconButton>
                                    <PktsIconButton
                                        disabled={loading}
                                        aria-label="Cancel save password"
                                        onClick={cancelSetPassword(user, idx)}
                                    >
                                        <X />
                                    </PktsIconButton>
                                </div>
                            ) : (
                                <PktsButton
                                    className="w-fit! px-6"
                                    disabled={loading}
                                    onClick={setPassword(user, idx)}
                                    variant="secondary"
                                >
                                    Reset Password
                                </PktsButton>
                            )}
                        </div>
                    </td>
                    <td className="p-2">
                        {user._edit || user._new ? (
                            <PktsInputSelect
                                defaultValue={JSON.stringify(user.scope)}
                                onChange={setScopes(user, idx)}
                                name="scope"
                            >
                                <PktsInputOption value={JSON.stringify(ROLES["READ_ONLY"])}>
                                    Read-Only
                                </PktsInputOption>
                                <PktsInputOption value={JSON.stringify(ROLES["READ_WRITE"])}>
                                    Read/Write
                                </PktsInputOption>
                                <PktsInputOption value={JSON.stringify(ROLES["PUBLISHER"])}>
                                    Publisher
                                </PktsInputOption>
                                <PktsInputOption value={JSON.stringify(ROLES["ADMIN"])}>
                                    Admin
                                </PktsInputOption>
                            </PktsInputSelect>
                        ) : (
                            <div className="ml-1">{getRoleLabel(user.scope)}</div>
                        )}
                    </td>
                    <td className="p-2">
                        <div className="flex gap-2">
                            {user._new ? (
                                <>
                                    <PktsIconButton
                                        disabled={loading}
                                        onClick={createUser(user, idx)}
                                        aria-label="Save new user"
                                    >
                                        <Save />
                                    </PktsIconButton>
                                    <PktsIconButton
                                        disabled={loading}
                                        onClick={cancelAddUser(user, idx)}
                                        aria-label="Cancel adding user"
                                    >
                                        <X />
                                    </PktsIconButton>
                                </>
                            ) : user._edit ? (
                                <>
                                    <PktsIconButton
                                        disabled={loading}
                                        onClick={commitUser(user, idx)}
                                        aria-label="Save changes"
                                    >
                                        <Save />
                                    </PktsIconButton>
                                    <PktsIconButton
                                        disabled={loading}
                                        onClick={cancelEditUser(user, idx)}
                                        aria-label="Cancel editing"
                                    >
                                        <X />
                                    </PktsIconButton>
                                </>
                            ) : (
                                <>
                                    <PktsIconButton
                                        disabled={loading}
                                        onClick={editUser(user, idx)}
                                        aria-label="Edit user"
                                    >
                                        <Pencil />
                                    </PktsIconButton>
                                    <PktsIconButton
                                        disabled={loading}
                                        onClick={deleteUser(user, idx)}
                                        aria-label="Delete user"
                                    >
                                        <Trash2 />
                                    </PktsIconButton>
                                </>
                            )}
                        </div>
                    </td>
                </tr>
            );
        });
    }

    return (
        <Accordion header="User Settings">
            <DeletionModal
                visible={!!confirmDelete}
                close={cancelDeleteUser}
                confirmDeleteUser={confirmDeleteUser}
                user={confirmDelete?.user}
            />

            <fieldset className="w-full min-w-0 flex flex-col items-end">
                <legend className="text-lg">Settings for user accounts for HTTP Basic Auth.</legend>

                <div className="grid grid-cols-1 w-full">
                    <form id="table-form" className="w-full min-w-0 overflow-x-auto pb-2">
                        <table className="table-fixed w-full text-left min-w-272">
                            <tbody>
                                <tr className="border-b border-light-copy">
                                    <th>
                                        <div className="flex items-center gap-2">
                                            <CircleUser />
                                            Name
                                        </div>
                                    </th>
                                    <th>
                                        <div className="flex items-center gap-2">
                                            <Mail />
                                            Email/Username
                                        </div>
                                    </th>
                                    <th>
                                        <div className="flex items-center gap-2">
                                            <KeyRound />
                                            Password
                                        </div>
                                    </th>
                                    <th className="w-40">
                                        <div className="flex items-center gap-2">
                                            <UserCog />
                                            Role
                                        </div>
                                    </th>
                                    <th className="w-36">
                                        <div className="flex items-center gap-2">
                                            <FileEdit />
                                            Actions
                                        </div>
                                    </th>
                                </tr>
                                {renderUsersList()}
                            </tbody>
                        </table>
                    </form>
                </div>

                <PktsButton
                    disabled={loading}
                    variant="primary"
                    className="mt-4 w-fit! pr-6"
                    prepend={<Plus />}
                    onClick={addUser}
                >
                    Add User
                </PktsButton>
            </fieldset>
        </Accordion>
    );
}
