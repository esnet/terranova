import { Icon } from "../components/Icon.component";
import { ModalDialog } from "../components/ModalDialog.component";
import { setAuthHeaders } from "../DataController";
import {
    API_URL,
    READ_SCOPE,
    READ_WRITE_SCOPE,
    PUBLISH_SCOPE,
    ADMIN_SCOPE,
    GOOGLE_SHEETS_CREDENTIAL_SOURCE,
} from "../../static/settings";
import * as React from "react";

export function GoogleSheetsSettings() {
    const [accessTokens, setAccessTokens] = React.useState<any[]>([]);
    const [confirmAddToken, setConfirmAddToken] = React.useState<boolean>(false);
    const [confirmDeleteToken, setConfirmDeleteToken] = React.useState<boolean>(false);
    const [loading, setLoading] = React.useState(true);
    const [unfurled, setUnfurled] = React.useState(false);
    const dynamicConfiguration =
        !!GOOGLE_SHEETS_CREDENTIAL_SOURCE && GOOGLE_SHEETS_CREDENTIAL_SOURCE === "dynamic";

    async function fetchSheetsDatasources() {
        let apiUrl = `${API_URL}/sheets/credentials/?limit=9999`;
        let headers = {
            "Content-Type": "application/json",
        } as any;
        headers = setAuthHeaders(headers);
        fetch(apiUrl, { headers: headers, method: "GET" }).then(function (response) {
            if (response.ok) {
                response.json().then((output) => {
                    setLoading(false);
                    setAccessTokens(output);
                });
            }
        });
    }

    React.useEffect(() => {
        fetchSheetsDatasources();
    }, []);

    function validateForm() {
        let formElem = document.getElementById(`table-form`);
        // @ts-ignore (doesn't exist on HTMLElement, but does on form)
        let valid = formElem?.checkValidity();
        if (!valid) {
            // @ts-ignore (says doesn't exist on HTMLElement, but does on form)
            formElem?.reportValidity();
        }
        return !!valid;
    }

    function cancelAddJWT() {
        setConfirmAddToken(false);
    }

    function confirmAddJWT() {
        setConfirmAddToken(false);
    }

    function addJWT() {
        setConfirmAddToken(true);
    }

    function submitForm(ev: any) {
        ev.preventDefault();
    }

    function confirmDelete() {
        setConfirmDeleteToken(true);
    }
    function cancelDelete() {
        setConfirmDeleteToken(false);
    }

    function renderAccessToken(accessToken: any) {
        return (
            <fieldset className="main-page-panel w-12/12" key={accessToken.project_id}>
                <div className="text-sm text-white bg-esnetblack-50 rounded-lg mt-4 px-4 py-2 mb-2">
                    Access Token
                    <h4 className="compound justify-start py-0 text-white">
                        <Icon
                            name={"badge-plus"}
                            className="icon md my-auto stroke-white ml-[-0.5rem]"
                        ></Icon>
                        {accessToken.project_id}
                    </h4>
                </div>
                <div className="tn-text text-right">
                    <label className="mt-[-0.5rem] mb-[-0.5rem]">
                        Sheets Data is cached hourly
                    </label>
                </div>
                <div>
                    <label>Project ID</label>
                    <input type="text" className="w-full" value={accessToken.project_id} disabled />
                </div>
                <div>
                    <label>Client Email</label>
                    <input
                        type="text"
                        className="w-full"
                        value={accessToken.client_email}
                        disabled
                    />
                </div>
                <div>
                    <label>Token URI</label>
                    <input type="text" className="w-full" value={accessToken.auth_uri} disabled />
                </div>
                <div>
                    <label>Private Key</label>
                    <input type="text" className="w-full" value="••••••••• (configured)" disabled />
                </div>
                {!dynamicConfiguration ? null : (
                    <div className="compound justify-end mt-6 mb-0">
                        <button className="btn primary" onClick={addJWT}>
                            Reconfigure JWT
                        </button>
                        <button className="btn warning ml-4" onClick={confirmDelete}>
                            Delete
                        </button>
                    </div>
                )}
            </fieldset>
        );
    }

    function renderAccessTokenList() {
        return accessTokens.map((accessToken) => {
            return renderAccessToken(accessToken);
        });
    }

    let addDialogFooter = (
        <>
            <div className="flex justify-end w-full">
                <div
                    className="compound hover:bg-mauve-200 cursor-pointer rounded-lg p-1 border pr-2"
                    onClick={cancelAddJWT}
                >
                    <Icon name="x" />
                    &nbsp;&nbsp;Cancel
                </div>

                <div
                    className="compound hover:bg-mauve-200 cursor-pointer rounded-lg p-1 border pr-2 ml-4"
                    onClick={confirmAddJWT}
                >
                    <Icon name="check" />
                    &nbsp;&nbsp;Add JWT
                </div>
            </div>
        </>
    );

    let deleteDialogFooter = (
        <>
            <div className="flex justify-end w-full">
                <div
                    className="compound hover:bg-mauve-200 cursor-pointer rounded-lg p-1 border pr-2"
                    onClick={cancelDelete}
                >
                    <Icon name="x" />
                    &nbsp;&nbsp;Cancel
                </div>

                <div
                    className="compound hover:bg-mauve-200 cursor-pointer rounded-lg p-1 border pr-2 ml-4"
                    onClick={confirmDelete}
                >
                    <Icon name="check" />
                    &nbsp;&nbsp;Delete Datasource Forever
                </div>
            </div>
        </>
    );

    return (
        <div className="w-full">
            <ModalDialog
                visible={confirmAddToken}
                dismiss={cancelAddJWT}
                header={"Add JWT"}
                footer={addDialogFooter}
                className="w-3/12"
            >
                <h4>JWT</h4>
                <div className="mb-12">
                    <textarea name="JWT"></textarea>
                </div>
            </ModalDialog>

            <ModalDialog
                visible={confirmDeleteToken}
                dismiss={cancelDelete}
                header={"Delete Sheets Datasource"}
                footer={deleteDialogFooter}
                className="w-3/12"
            >
                <h4>Delete Datasource</h4>
                <div className="mb-12">
                    Datasource 'Mocked Network Traffic' will be permanently deleted.
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
                                    name="file-spreadsheet"
                                    className="icon stroke-color-text align-middle inline lg"
                                />
                                Google Sheets Access Tokens
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
                            Manage Access Tokens for Google Sheets.{" "}
                            <label>
                                A datasource will be configured for each Sheet that conforms to the{" "}
                                <a
                                    href="https://docs.google.com/spreadsheets/d/191BuMoWa2CooMXJQzyNtBRlNLHamBmh-8PCoIGDELxA/edit"
                                    target="_new"
                                >
                                    Terranova Topology Format
                                </a>
                                . Sheets will be cached hourly.
                            </label>
                        </span>
                    </div>
                    {unfurled ? (
                        <div className="flex flex-row">
                            <div className="m-2 w-full">
                                <form id="sheets-datasources-form" onSubmit={submitForm}>
                                    <div className="grid grid-cols-2">
                                        {renderAccessTokenList()}

                                        {!dynamicConfiguration ? null : (
                                            <fieldset
                                                className="mt-4 mr-3 primary main-page-panel bg-esnetwhite-50"
                                                onClick={addJWT}
                                            >
                                                <h5 className="compound justify-start w-full pb-1">
                                                    <Icon
                                                        name="plus"
                                                        className="sm mr-1 ml-[-0.5rem] p-1"
                                                    />
                                                    &nbsp;Add Google Sheets Datasource
                                                </h5>
                                                <div className="tn-text">Using JWT Token</div>
                                            </fieldset>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>
                    ) : null}
                </fieldset>
            </div>
        </div>
    );
}
