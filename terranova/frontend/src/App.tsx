import { createBrowserRouter, RouterProvider } from "react-router-dom";
import oidcConfig from "./OIDCConfig";
import { AuthenticationProvider } from "./AuthService";
import { AuthProvider as OIDCAuthProvider } from "react-oidc-context";

import "../dist/terranova.css";

import { Protected } from "./components/ProtectedRoute.component";

import { HomePageComponent } from "./pages/Home.page";
import { MapEditorPageComponent } from "./pages/MapEditor.page";
import { NodeTemplateEditorPageComponent } from "./pages/NodeTemplateEditor.page";
import { MapCreatorPageComponent } from "./pages/MapCreator.page";
import { DatasetLibraryPageComponent } from "./pages/DatasetLibrary.page";
import { DatasetCreatorPageComponent } from "./pages/DatasetCreator.page";
import { DatasetEditorPageComponent } from "./pages/DatasetEditor.page";
import { LoginPageComponent } from "./pages/Login.page";
import { ErrorPage } from "./pages/Error.page";
import { SettingsPageComponent } from "./pages/Settings.page";
import { Home } from "./pages/Home.page";

function App() {
    const router = createBrowserRouter([
        {
            path: "/",
            element: <Home />,
            errorElement: <ErrorPage />,
            children: [
                {
                    path: "/",
                    element: (
                        <Protected>
                            <HomePageComponent />
                        </Protected>
                    ),
                },
                {
                    path: "map/new/",
                    element: (
                        <Protected>
                            <MapCreatorPageComponent />
                        </Protected>
                    ),
                },
                {
                    path: "map/:mapId/",
                    element: (
                        <Protected>
                            <MapEditorPageComponent />
                        </Protected>
                    ),
                },
                {
                    path: "template/new",
                    element: (
                        <Protected>
                            <NodeTemplateEditorPageComponent />
                        </Protected>
                    ),
                },
                {
                    path: "template/:templateId",
                    element: (
                        <Protected>
                            <NodeTemplateEditorPageComponent />
                        </Protected>
                    ),
                },
                {
                    path: "dataset/new/",
                    element: (
                        <Protected>
                            <DatasetCreatorPageComponent />
                        </Protected>
                    ),
                },
                {
                    path: "/dataset/:datasetId",
                    element: (
                        <Protected>
                            <DatasetEditorPageComponent />
                        </Protected>
                    ),
                },
                {
                    path: "/library/:datatype",
                    element: (
                        <Protected>
                            <DatasetLibraryPageComponent />
                        </Protected>
                    ),
                },
                {
                    path: "/settings",
                    element: (
                        <Protected>
                            <SettingsPageComponent />
                        </Protected>
                    ),
                },
                {
                    path: "logout",
                    element: <LoginPageComponent doLogout={true} message="Logging out..." />,
                },
                {
                    path: "login",
                    element: <LoginPageComponent next="/" />,
                },
            ],
        },
    ]);
    return (
        <>
            <div className="App">
                <OIDCAuthProvider {...oidcConfig}>
                    <AuthenticationProvider>
                        <RouterProvider router={router} />
                    </AuthenticationProvider>
                </OIDCAuthProvider>
            </div>
        </>
    );
}

export default App;
