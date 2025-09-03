// This component deals with fetching and persistence between the page and the API.
// The “save” buttons will interface with this object, which, in turn, persists data to the API

import { setPath } from "./data/utils";
import { AUTH_BACKEND } from "../static/settings";

function getUser() {
    if (AUTH_BACKEND == "oidc") {
        return (window as any).OIDCUser;
    }
    if (AUTH_BACKEND == "basic") {
        return (window as any).BasicUser;
    }
}

function setAuthHeaders(headers: any) {
    const user = getUser();
    headers = { ...headers };
    if (AUTH_BACKEND == "basic") {
        if (user) {
            headers["Authorization"] = `Basic ${user}`;
        }
    }
    if (AUTH_BACKEND == "oidc") {
        if (user) {
            const token = user?.access_token;
            headers["Authorization"] = `Bearer ${token}`;
        }
    }
    return headers;
}

class DataController {
    instance: any;
    link: string | null;
    error: string;
    auth: any;
    setInstance: (instance: any) => void;

    constructor(link: string | null, instance: any, setInstance: any) {
        this.link = link;
        this.instance = instance;
        this.setInstance = setInstance;
        this.error = "";
    }

    /**
     * Performs a fetch of a resource or a set of resources from the controller's currently assigned endpoint.
     * This function accepts either a link or "dataset" as the assigned endpoint, in which case, a mockup of
     * a dataset is fetched.
     *
     * An optional lookupId (a unique index key) may be provided to identify a single resource to fetch. Otherwise,
     * an entire set will be fetched.
     *
     * @param {string | undefined} lookupId             Optional. Performs a lookup by fetching via a this as a field 'id' on
     *                                                  the endpoint.
     * @returns
     */
    fetch = async (headers: any = { "Content-Type": "application/json" }) => {
        if (!this.link) return;
        headers = setAuthHeaders(headers);
        try {
            const response = await fetch(this.link, { headers: headers });
            let data = await response.json();

            if (response.status == 200) {
                this.instance = data;
                if (Array.isArray(this.instance)) {
                    this.setInstance([...this.instance]);
                } else {
                    this.setInstance({ ...this.instance });
                }
                return response;
            } else if (response.status == 404) {
                this.error = `${this.link}: ${response.statusText}`;
                console.error(this.error);
                return response;
            } // what about other response statuses?
        } catch (e) {
            this.error = (e as Error).message;
            console.error(this.error);
        }
    };

    save = async (method: string, headers: any = { "Content-Type": "application/json" }) => {
        if (!this.link) return;
        headers = setAuthHeaders(headers);
        var response = await fetch(this.link, {
            method: method,
            headers: headers,
            body: JSON.stringify(this.instance),
        });
        if (response.ok) {
            var output = await response.json();
            this.instance = output.object;
        } else {
            let msg = "Error " + response.status + " " + response.statusText;
            console.error(msg);
        }
    };

    update = async () => {
        await this.save("PUT");
    };

    create = async () => {
        await this.save("POST");
    };

    setProperty = (property: string | null | undefined, value: any) => {
        if (!property) return;
        // @ts-ignore
        setPath(this.instance, property, value);
        // using this horrible triple dots implicit copy to work around
        // React's desire for the object to change in memory to recognize
        // a change of state.
        if (Array.isArray(this.instance)) {
            this.setInstance([...this.instance]);
        } else {
            this.setInstance({ ...this.instance });
        }
    };
}

export { getUser, DataController, setAuthHeaders };
