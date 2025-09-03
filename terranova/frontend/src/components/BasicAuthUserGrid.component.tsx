import { Icon } from "../components/Icon.component";
import { ModalDialog } from "../components/ModalDialog.component";
import { setAuthHeaders } from "../DataController";
import {
    API_URL,
    READ_SCOPE,
    READ_WRITE_SCOPE,
    PUBLISH_SCOPE,
    ADMIN_SCOPE,
} from "../../static/settings";
import * as React from "react";

interface DeletionData {
    user: any;
    index: number;
}

export function BasicAuthUserGrid() {
    const [users, setUsers] = React.useState<any[]>([]);
    const [confirmDelete, setConfirmDelete] = React.useState<DeletionData | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [unfurled, setUnfurled] = React.useState(false);

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
            let apiUrl = `${API_URL}/user/`;
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
            let payload = user;
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
            let value = elem.options[elem.selectedIndex].value;
            user.scope = JSON.parse(event.target.value);
            users[idx] = user;
            setUsers(users);
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
        if (loading) {
            return (
                <tr>
                    <td colSpan={5}>
                        <div className="compound justify-start">
                            <Icon name="hourglass" className="align-middle lg ml-12 mr-2" />
                            <h5 className="py-0 my-0">Loading...</h5>
                        </div>
                    </td>
                </tr>
            );
        }
        return users.map((user, idx) => {
            return (
                <tr className="border-b-[1px] border-color-text" key={JSON.stringify(user)}>
                    <td className="w-48">
                        {user._edit || user._new ? (
                            <>
                                <input
                                    type="text"
                                    defaultValue={user.name}
                                    className="w-full"
                                    required
                                    onInput={setUserName(user, idx)}
                                    onInvalid={invalidMessage("Please enter the user's full name")}
                                />
                            </>
                        ) : (
                            user.name
                        )}
                    </td>
                    <td className="text-center w-32">
                        {user._edit || user._new ? (
                            <>
                                <input
                                    type="text"
                                    defaultValue={user.email}
                                    className="w-full"
                                    required
                                    onChange={setUserUsername(user, idx)}
                                    onInvalid={invalidMessage(
                                        "Please enter the user's email address (used as username)"
                                    )}
                                />
                            </>
                        ) : (
                            user.email
                        )}
                    </td>
                    <td className="text-center w-48" key={JSON.stringify(Object.values(user))}>
                        <div className="relative">
                            {user._passwordReset ? (
                                <div
                                    className={`tooltip-box copied-tooltip-box animate-fade opacity-0 mt-[-1.7rem] absolute`}
                                >
                                    Password Reset.
                                </div>
                            ) : null}
                            {user._new ? (
                                <input
                                    type="password"
                                    className="w-full"
                                    required
                                    onChange={setUserPassword(user, idx)}
                                    onInvalid={invalidMessage("Please enter a password")}
                                />
                            ) : user._setPassword ? (
                                <>
                                    <div className="compound">
                                        <input
                                            type="password"
                                            className="w-7/12"
                                            required
                                            onInput={setUserPassword(user, idx)}
                                            onInvalid={invalidMessage("Please enter a password")}
                                        />
                                        <Icon
                                            name="check"
                                            className="icon btn bordered"
                                            onClick={commitPassword(user, idx)}
                                        />
                                        <Icon
                                            name="x"
                                            className="icon btn bordered"
                                            onClick={cancelSetPassword(user, idx)}
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    ••••••••&nbsp;
                                    <button onClick={setPassword(user, idx)} className="ml-4">
                                        Reset
                                    </button>
                                </>
                            )}
                        </div>
                    </td>
                    <td className="text-center">
                        <select
                            defaultValue={JSON.stringify(user.scope)}
                            onChange={setScopes(user, idx)}
                        >
                            <option value={JSON.stringify(ROLES["READ_ONLY"])}>Read-Only</option>
                            <option value={JSON.stringify(ROLES["READ_WRITE"])}>Read/Write</option>
                            <option value={JSON.stringify(ROLES["PUBLISHER"])}>Publisher</option>
                            <option value={JSON.stringify(ROLES["ADMIN"])}>Admin</option>
                        </select>
                    </td>
                    <td className="text-right">
                        <div className="compound">
                            <div className="relative">
                                {user._saved ? (
                                    <div
                                        className={`tooltip-box copied-tooltip-box animate-fade opacity-0 mt-[-1.7rem] absolute`}
                                    >
                                        Saved!
                                    </div>
                                ) : null}
                                {user._new ? (
                                    <Icon
                                        name="save"
                                        className="icon btn bordered"
                                        onClick={createUser(user, idx)}
                                    />
                                ) : (
                                    <Icon
                                        name="save"
                                        className="icon btn bordered"
                                        onClick={commitUser(user, idx)}
                                    />
                                )}
                            </div>
                            {user._new ? (
                                <Icon
                                    name="x"
                                    className="icon btn bordered"
                                    onClick={cancelAddUser(user, idx)}
                                />
                            ) : user._edit ? (
                                <Icon
                                    name="x"
                                    className="icon btn bordered"
                                    onClick={cancelEditUser(user, idx)}
                                />
                            ) : (
                                <Icon
                                    name="pencil"
                                    className="icon btn bordered"
                                    onClick={editUser(user, idx)}
                                />
                            )}
                            {!user._new ? (
                                <Icon
                                    name="trash"
                                    className="icon btn bordered"
                                    onClick={deleteUser(user, idx)}
                                />
                            ) : null}
                        </div>
                    </td>
                </tr>
            );
        });
    }

    let footer = (
        <>
            <div className="flex justify-end w-full">
                <div
                    className="compound hover:bg-mauve-200 cursor-pointer rounded-lg p-1 border pr-2"
                    onClick={cancelDeleteUser}
                >
                    <Icon name="x" />
                    &nbsp;&nbsp;Cancel
                </div>

                <div
                    className="compound hover:bg-mauve-200 cursor-pointer rounded-lg p-1 border pr-2 ml-4"
                    onClick={confirmDeleteUser}
                >
                    <Icon name="check" />
                    &nbsp;&nbsp;Confirm Deletion
                </div>
            </div>
        </>
    );
    return (
        <div className="w-full">
            <ModalDialog
                visible={!!confirmDelete}
                dismiss={cancelDeleteUser}
                header={"Confirm Deletion"}
                footer={footer}
                className="w-3/12"
            >
                <h4>Are You Sure?</h4>
                <div className="mb-12">
                    Please confirm deletion for user:
                    <br />
                    <div className="ml-4 mt-4">
                        {confirmDelete?.user ? confirmDelete.user.name : null}&nbsp;
                        <span className="monospace">
                            '{confirmDelete?.user ? confirmDelete.user.username : null}'
                        </span>
                    </div>
                </div>
            </ModalDialog>
            <div className="w-full lg:w-10/12 xl:w-10/12 mx-auto pt-6">
                <fieldset className="w-full">
                    <div className="m-2 w-full">
                        <div className="compound">
                            <h4
                                className="compound justify-start pt-2 pb-0"
                                onClick={() => {
                                    setUnfurled(!unfurled);
                                }}
                            >
                                <Icon
                                    name="user-cog"
                                    className="icon stroke-color-text align-middle inline lg"
                                />
                                User Settings
                            </h4>
                            {unfurled ? (
                                <Icon
                                    name="chevron-down"
                                    className="icon align-middle inline lg"
                                    onClick={() => {
                                        setUnfurled(false);
                                    }}
                                />
                            ) : (
                                <Icon
                                    name="chevron-left"
                                    className="icon align-middle inline lg"
                                    onClick={() => {
                                        setUnfurled(true);
                                    }}
                                />
                            )}
                        </div>
                        <span className="tn-text">
                            Settings for user accounts for HTTP Basic Auth.
                        </span>
                    </div>
                    {unfurled ? (
                        <div className="flex flex-row">
                            <div className="m-2 w-full">
                                <form id="table-form">
                                    <table className="table-auto w-full user-settings">
                                        <tbody>
                                            <tr className="bg-tn-layer-2 rounded-lg border-b-[1px] border-color-text">
                                                <th className="pb-0">
                                                    <span className="compound inline-flex items-center">
                                                        <Icon
                                                            name="circle-user"
                                                            className="icon sm stroke-color-text"
                                                        />
                                                        Name
                                                    </span>
                                                </th>
                                                <th className="pb-0">
                                                    <span className="compound inline-flex items-center">
                                                        <Icon
                                                            name="mail"
                                                            className="icon sm stroke-color-text"
                                                        />
                                                        Username
                                                    </span>
                                                </th>
                                                <th className="pb-0">
                                                    <span className="compound inline-flex items-center">
                                                        <Icon
                                                            name="key-round"
                                                            className="icon sm stroke-color-text"
                                                        />
                                                        Password
                                                    </span>
                                                </th>
                                                <th className="pb-0">
                                                    <span className="compound inline-flex items-center">
                                                        <Icon
                                                            name="user-cog"
                                                            className="icon sm stroke-color-text"
                                                        />
                                                        Role
                                                    </span>
                                                </th>
                                                <th className="pb-0">
                                                    <span className="compound inline-flex items-center">
                                                        <Icon
                                                            name="file-edit"
                                                            className="icon sm stroke-color-text"
                                                        />
                                                        Actions
                                                    </span>
                                                </th>
                                            </tr>
                                            {renderUsersList()}
                                        </tbody>
                                    </table>
                                </form>
                                <div className="flex justify-start">
                                    <button
                                        className="btn compound mt-4 mr-3 primary"
                                        onClick={addUser}
                                    >
                                        <Icon name="plus" className="sm mr-1 ml-[-0.5rem] p-1" />{" "}
                                        Add User
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </fieldset>
            </div>
        </div>
    );
}
