import { useRouteError, isRouteErrorResponse } from "react-router-dom";
import { Corridor } from "corridor-esnet";

export function ErrorPage() {
    const error: any = useRouteError();

    if (isRouteErrorResponse(error)) {
        return (
            <div className="error-page bg-esnetblue-50">
                <Corridor />
                <br />
                <center>
                    <h1>Oops!</h1>
                    <p>Sorry, an unexpected error has occurred.</p>
                    <p>
                        <i>
                            {error.status} {error.statusText}
                        </i>
                    </p>
                </center>
            </div>
        );
    } else {
        console.error(error);
        return (
            <div className="error-page bg-esnetblue-50">
                <Corridor />
                <br />
                <center>
                    <h1>Oops!</h1>
                    <p>Sorry, an unknown error has occurred.</p>
                </center>
            </div>
        );
    }
}
