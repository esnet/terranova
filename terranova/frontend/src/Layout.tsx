import { Outlet } from "react-router-dom";
import { READ_SCOPE } from "../static/settings";
import { NavBar } from "./components/NavBar";
import { ReadOnlyWarning } from "./components/ReadOnlyWarning.component";
import { FavoritesContextProvider } from "./context/FavoritesContextProvider";
import { GlobalLastEditedContextProvider } from "./context/GlobalLastEditedContextProvider";
import { LastEditedContextProvider } from "./context/LastEditedContextProvider";
import { UserDataContextProvider } from "./context/UserDataContextProvider";
import { useAuth } from "./AuthService";
import { Sidebar } from "./components/SideBar";

function GrayImageBackground({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative flex-1 h-full min-h-0">
            <img
                src="/terranova-logo-greyscale.png"
                alt="Terranova Background"
                className="absolute inset-0 -z-10 h-full w-full object-contain p-12 opacity-25"
            />
            <div className="relative w-full h-full overflow-y-auto">{children}</div>
        </div>
    );
}

export function Layout() {
    let auth = useAuth();
    return (
        <div className="w-full h-full overflow-hidden flex flex-col">
            {auth?.isAuthenticated &&
            auth?.user?.scope &&
            auth.user.scope.indexOf(READ_SCOPE) >= 0 ? (
                <>
                    <ReadOnlyWarning />
                    <UserDataContextProvider>
                        <LastEditedContextProvider>
                            <FavoritesContextProvider>
                                <GlobalLastEditedContextProvider>
                                    <NavBar />
                                    <div className="flex-1 flex relative w-full min-h-0">
                                        <Sidebar />
                                        <GrayImageBackground>
                                            <Outlet />
                                        </GrayImageBackground>
                                    </div>
                                </GlobalLastEditedContextProvider>
                            </FavoritesContextProvider>
                        </LastEditedContextProvider>
                    </UserDataContextProvider>
                </>
            ) : (
                <Outlet />
            )}
        </div>
    );
}

export default Layout;
