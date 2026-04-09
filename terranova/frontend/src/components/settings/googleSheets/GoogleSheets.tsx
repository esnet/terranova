import * as React from "react";
import { setAuthHeaders } from "../../../DataController";
import { API_URL, GOOGLE_SHEETS_CREDENTIAL_SOURCE } from "../../../../static/settings";
import { Accordion } from "../../Accordion";
import { AddJWTModal } from "./AddJWTModal";
import { DeleteDatasourceModal } from "./DeleteDatasourceModal";
import { AccessTokenCard } from "./AccessTokenCard";
import { Plus } from "lucide-react";
import Card from "../../Card"; // Adjust path as needed

export function GoogleSheetsSettings() {
    const [accessTokens, setAccessTokens] = React.useState<any[]>([]);
    const [confirmAddToken, setConfirmAddToken] = React.useState<boolean>(false);
    const [confirmDeleteToken, setConfirmDeleteToken] = React.useState<boolean>(false);
    const [tokenToDelete, setTokenToDelete] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

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

    async function confirmAddJWT(jwtText: string) {
        setConfirmAddToken(false);
        const headers = setAuthHeaders({ "Content-Type": "application/json" });
        await fetch(
            `${API_URL}/sheets/credentials/?jwt_credential=${encodeURIComponent(jwtText)}`,
            {
                headers,
                method: "POST",
            },
        );
        fetchSheetsDatasources();
    }

    async function handleConfirmDelete() {
        setConfirmDeleteToken(false);
        if (!tokenToDelete) return;
        const headers = setAuthHeaders({});
        await fetch(`${API_URL}/sheets/credentials/${tokenToDelete.project_id}`, {
            headers,
            method: "DELETE",
        });
        setTokenToDelete(null);
        fetchSheetsDatasources();
    }

    function submitForm(ev: React.FormEvent) {
        ev.preventDefault();
    }

    return (
        <div className="w-full">
            <AddJWTModal
                visible={confirmAddToken}
                setVisible={setConfirmAddToken}
                onConfirm={confirmAddJWT}
            />

            <DeleteDatasourceModal
                visible={confirmDeleteToken}
                setVisible={setConfirmDeleteToken}
                onConfirm={handleConfirmDelete}
                name={tokenToDelete?.project_id}
            />

            <Accordion header="Google Sheets Access Tokens">
                <fieldset className="w-full">
                    <legend className="text-lg">Manage Access Tokens for Google Sheets.</legend>
                    <div className="mb-4 tn-text">
                        A datasource will be configured for each Sheet that conforms to the{" "}
                        <a
                            href="https://docs.google.com/spreadsheets/d/191BuMoWa2CooMXJQzyNtBRlNLHamBmh-8PCoIGDELxA/edit"
                            target="_new"
                        >
                            Terranova Topology Format
                        </a>
                        . Sheets are cached hourly.
                    </div>

                    <form id="sheets-datasources-form" onSubmit={submitForm}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {accessTokens.map((accessToken) => (
                                <AccessTokenCard
                                    key={accessToken.project_id}
                                    accessToken={accessToken}
                                    dynamicConfiguration={dynamicConfiguration}
                                    onReconfigure={() => setConfirmAddToken(true)}
                                    onDelete={() => {
                                        setTokenToDelete(accessToken);
                                        setConfirmDeleteToken(true);
                                    }}
                                />
                            ))}

                            {dynamicConfiguration && (
                                <button
                                    type="button"
                                    className="block cursor-pointer w-full h-fit rounded-lg hover:text-dark-primary transition duration-150"
                                    onClick={() => setConfirmAddToken(true)}
                                >
                                    <Card className="flex flex-col items-center justify-center gap-2">
                                        <div className="flex gap-2 text-lg font-medium">
                                            <Plus />
                                            Add Google Sheets Datasource
                                        </div>
                                        <span className="text-inherit/80">Using JWT Token</span>
                                    </Card>
                                </button>
                            )}
                        </div>
                    </form>
                </fieldset>
            </Accordion>
        </div>
    );
}
