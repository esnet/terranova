// TODO: implement overridable config system
//import config from '../config';
import { useState } from "react";
import { API_URL } from "../../static/settings";

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(" ");
}

/* Components ******************************/

export function Logo() {
    const colors = `.st0{fill:#6D6F71;}
    .st1{fill:#6DB6CA; stroke:n}
    .st2{fill:#48C5DC;}`;
    return (
        <div className="flex-shrink-0">
            <a href="https://es.net">
                <svg
                    version="1.1"
                    id="Layer_1"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    x="0px"
                    y="0px"
                    viewBox="0 0 36 36"
                    xmlSpace="preserve"
                    className="esnet-logo mt-1"
                >
                    <style type="text/css">{colors}</style>
                    <circle className="st0" cx="18" cy="18" r="17.09" />
                    <g>
                        <path
                            className="st1"
                            d="M5.21,20.11c0.92-1.17,2.18-2.22,3.52-3.4c-2.54-2.5-4.53-5.4-5.52-7.26c-1.1,1.9-1.84,4.03-2.14,6.3
              C2.05,17.06,3.55,18.68,5.21,20.11z"
                        />
                        <path
                            className="st1"
                            d="M30.71,26.33c1.14-0.3,2.12-0.66,2.68-0.9c0.26-0.53,0.49-1.08,0.69-1.64c-0.59,0.15-1.9,0.4-3.37,0.55
              C30.71,25.05,30.77,25.72,30.71,26.33z"
                        />
                        <path
                            className="st1"
                            d="M15.13,21.29c-0.86-0.45-2.1-1.22-2.86-1.71c-1.2,1.09-2.2,2.26-3.06,3.37c1.29,0.73,3.13,1.65,4.7,2.23
              c6.04,2.26,11.42,2.15,14.99,1.55c-0.06-0.73-0.12-1.46-0.28-2.26C25.07,24.5,20.06,23.86,15.13,21.29z"
                        />
                        <path
                            className="st1"
                            d="M23.29,14.35c3.03,3.42,4.5,7.34,5.1,10.46c0.95-0.01,1.76-0.16,2.53-0.24c-0.02-3.13-1.1-7.64-3.71-11.69
              c-1.39,0.12-2.9,0.47-4.44,0.89C22.84,13.85,23.21,14.26,23.29,14.35z"
                        />
                        <path
                            className="st1"
                            d="M28.61,26.45c0.15,1.95,0.05,3.91-0.12,5.03c0.56-0.43,1.08-0.9,1.58-1.4c0.3-0.95,0.63-2.48,0.78-4.02
              C30.2,26.24,29.42,26.31,28.61,26.45z"
                        />
                        <path
                            className="st1"
                            d="M25.18,10.25c-0.26-0.29-0.98-1.07-1.26-1.36c-3.95-4.02-7.69-6.16-10.84-7.26c-2.72,0.82-5.15,2.29-7.11,4.24
              c2.83,0.29,8.55,1.58,13.47,4.99C21.41,10.34,23.36,10.3,25.18,10.25z"
                        />
                        <path
                            className="st2"
                            d="M28.64,26.78c0.81-0.14,1.55-0.3,2.19-0.47c0.06-0.62,0.09-1.28,0.09-1.97c-0.77,0.08-1.64,0.13-2.59,0.14
              C28.48,25.28,28.58,26.05,28.64,26.78z"
                        />
                        <path
                            className="st1"
                            d="M24.3,9.75c1.08,1.19,2.05,2.41,2.81,3.58c2.88-0.25,5.72-0.01,7.41,0.31c-0.25-0.93-0.57-1.83-0.96-2.7
              C31.37,10.31,27.83,9.67,24.3,9.75z"
                        />
                        <path
                            className="st1"
                            d="M5.22,19.68c-1.33,1.69-2.47,3.54-3.07,4.72c0.84,2.08,2.08,3.96,3.62,5.54c0.65-1.7,2.12-4.53,4.14-7.1
              C8.13,21.82,6.53,20.8,5.22,19.68z"
                        />
                        <path
                            className="st1"
                            d="M15.96,17.34c2.4-1.6,5.1-2.7,7.39-3.33c-1.28-1.4-2.51-2.59-3.91-3.56c-1.2,0.31-2.84,0.84-4.06,1.39
              c-2.82,1.27-5.44,3.14-7.31,4.81c1.23,1.21,2.71,2.37,4.38,3.47C13.41,19.24,14.75,18.14,15.96,17.34z"
                        />
                        <path
                            className="st2"
                            d="M12.71,19.87c-1.67-1.1-3.11-2.29-4.34-3.5c-1.33,1.19-2.44,2.41-3.36,3.57c1.31,1.13,2.84,2.24,4.61,3.24
              C10.49,22.08,11.51,20.96,12.71,19.87z"
                        />
                        <path
                            className="st2"
                            d="M23.06,14.09c1.54-0.42,3.03-0.67,4.42-0.79c-0.75-1.17-1.66-2.35-2.74-3.54c-1.82,0.04-3.75,0.28-5.73,0.79
              C20.41,11.52,21.78,12.69,23.06,14.09z"
                        />
                    </g>
                </svg>
            </a>
        </div>
    );
}

export interface ClassedElementProps {
    className: undefined | any;
}

export function Bars3Icon({ className }: ClassedElementProps) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            aria-hidden="true"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
        </svg>
    );
}

export function XMarkIcon({ className }: ClassedElementProps) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            aria-hidden="true"
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

export function BellIcon({ className }: ClassedElementProps) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            aria-hidden="true"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
            />
        </svg>
    );
}

export interface NavigationProps {
    navigation: undefined | Array<{ name: string; href: string; current: boolean }>;
}

export function NavigationItems({ navigation }: NavigationProps) {
    return (
        <div className="ml-10 flex items-baseline space-x-4">
            {navigation?.map((item) => (
                <a
                    key={item.name}
                    href={item.href}
                    className={classNames(
                        item.current ? "bg-teal-900" : "hover:font-bold",
                        "navigation-item"
                    )}
                    aria-current={item.current ? "page" : undefined}
                >
                    {item.name}
                </a>
            ))}
        </div>
    );
}

/* Mobile States *************************************************/
export interface HamburgerMenuProps {
    open: undefined | boolean;
}
export function HamburgerMenu({ open }: HamburgerMenuProps) {
    return (
        <div className="-mr-2 flex md:hidden">
            {/* Mobile menu button */}
            <button
                type="button"
                className="inline-flex items-center justify-center rounded-md bg-color-primary p-2 text-white hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-teal-800"
            >
                <span className="sr-only">Open main menu</span>
                {open ? (
                    <XMarkIcon className="hidden h-6 w-6" />
                ) : (
                    <Bars3Icon className="block h-6 w-6" />
                )}
            </button>
        </div>
    );
}

export interface ProfileMenuProps {
    user: {
        username: string | null;
        email: string | null;
        profile: null | { image: string | undefined };
    };
    userNavigation: {
        href: string;
        active: boolean;
        name: string;
    }[];
}
export function ProfileMenu({ user, userNavigation }: ProfileMenuProps) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative ml-3">
            <div>
                <button type="button" onClick={() => setOpen(!open)} className="profile-button">
                    <span className="sr-only">Open user menu</span>
                    <img className="h-7 w-7 rounded-full" src={user.profile?.image} alt="" />
                </button>
            </div>

            {open ? (
                <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {userNavigation.map((item) => (
                        <a
                            href={item.href}
                            key={item.name}
                            className={classNames(
                                item.active ? "bg-esnetblue-100" : "",
                                "block px-4 py-2 text-sm text-color-primary"
                            )}
                            onClick={() => setOpen(!open)}
                        >
                            {item.name}
                        </a>
                    ))}
                </div>
            ) : null}
        </div>
    );
}

export interface TopMenuProps {
    user: ProfileMenuProps["user"];
    userNavigation: ProfileMenuProps["userNavigation"];
    navigation: undefined | NavigationProps["navigation"];
}
export function MobileMenu({ user, userNavigation, navigation }: TopMenuProps) {
    return (
        <div className="md:hidden">
            <div className="space-y-1 px-2 pt-2 pb-3 sm:px-3">
                <NavigationItems navigation={navigation} />
            </div>
            <div className="border-t border-teal-700 pt-4 pb-3">
                <div className="flex items-center px-5">
                    <div className="flex-shrink-0">
                        <img className="h-10 w-10 rounded-full" src={user.profile?.image} alt="" />
                    </div>
                    <div className="ml-3">
                        <div className="text-base font-medium leading-none text-white">
                            {user.username}
                        </div>
                        <div className="text-sm font-medium leading-none text-esnetblue-600">
                            {user.email}
                        </div>
                    </div>
                    {/* <button
              type="button"
              className="ml-auto flex-shrink-0 rounded-full bg-color-primary p-1 text-color-link hover:stroke-color-link-hover focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-teal-800"
            >
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-5 w-5" />
            </button> */}
                </div>
                <div className="mt-3 space-y-1 px-2">
                    {userNavigation.map((item) => (
                        <a
                            key={item.name}
                            href={item.href}
                            className="block rounded-md px-3 py-2 text-base font-medium text-esnetblue-600 hover:bg-color-primary hover:text-white"
                        >
                            {item.name}
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* Desktop States *************************************************/
export function DesktopMenu({ user, userNavigation, navigation }: TopMenuProps) {
    return (
        <nav>
            <div className="container">
                <div className="centered">
                    <Logo />
                    <div className="hidden md:block">
                        <NavigationItems navigation={navigation}></NavigationItems>
                    </div>
                </div>
                <div className="hidden md:block">
                    <div className="centered ml-4 md:ml-6">
                        {/*<button
                    type="button"
                    className="bell-icon"
                  >
                    <span className="sr-only">View notifications</span>
                    <BellIcon className="h-5 w-5" />
                  </button>*/}

                        <ProfileMenu user={user} userNavigation={userNavigation}></ProfileMenu>
                    </div>
                </div>
                <HamburgerMenu open={false}></HamburgerMenu>
            </div>
        </nav>
    );
}

/* Loading State **********************************************/

export function LoadingPlaceholderMenu() {
    return (
        <nav>
            <div className="container">
                <div className="loading">Loading...</div>
            </div>
        </nav>
    );
}

import { createElement, Fragment, useEffect } from "react";
import ReactDOM from "react-dom/client";

const fetchJSON = (input: string, config: any | undefined) => {
    return fetch(input, config).then((response) => {
        if (response.ok) {
            return response.json();
        } else {
            return null;
        }
    });
};

interface TopBarProps {
    logoutPath?: string;
}

export function TopBar(props: TopBarProps) {
    let logoutPath = props.logoutPath ? props.logoutPath : "/logout";
    const userNavigation = [{ name: "Sign out", href: logoutPath, active: false }];

    var [navigation, setNavigation] = useState([{ name: "Terranova", href: "/", current: false }]);
    var [messages, setMessages] = useState([]);
    var [user, setUser] = useState({
        username: "Placeholder",
        email: "placeholder@example.com",
        profile: {
            image: "data:image/png;base64,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",
        },
    });

    const [error, setError] = useState();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        /*void fetch(API_URL + "/csrftoken/", { credentials: "include", signal: AbortSignal.timeout(5000) })
            .then((response)=>{
              fetchJSON(API_URL + "/messages/", { credentials: "include", signal: AbortSignal.timeout(5000) })
                .then((jsonResponse)=>{ if(jsonResponse){ setMessages(jsonResponse) } })
              fetchJSON(API_URL + "/navigation/", { credentials: "include", signal: AbortSignal.timeout(5000) })
                .then((jsonResponse)=>{ if(jsonResponse){ setNavigation(jsonResponse) } })
              fetchJSON(API_URL + "/profile/", { credentials: "include", signal: AbortSignal.timeout(5000) })
                .then((jsonResponse)=>{ if(jsonResponse){ setUser(jsonResponse) } })
            })
            .catch(() => setLoading(false))
            .finally(() => setLoading(false)) */
        setLoading(false);
    }, []);

    if (loading) {
        return (
            <div id="top-bar" className="top-bar">
                <LoadingPlaceholderMenu />
            </div>
        );
    }

    return (
        <div id="top-bar" className="top-bar">
            <DesktopMenu user={user} userNavigation={userNavigation} navigation={navigation} />
            <MobileMenu user={user} userNavigation={userNavigation} navigation={navigation} />
        </div>
    );
}
