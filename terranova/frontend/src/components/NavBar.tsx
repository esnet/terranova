import { ESDropdown, ESDropdownAnchor, ESAvatar, ESDropdownContent } from "@esnet/packets-ui";
import { useState } from "react";
import { useAuth } from "react-oidc-context";

function ProfileMenu() {
    const auth = useAuth();

    const [open, setOpen] = useState(false);
    const links = [
        {
            name: "Sign out",
            href: "/logout",
        },
    ];

    return (
        <ESDropdown className="ml-auto" carat mode="both">
            <ESDropdownAnchor>
                <ESAvatar
                    // srcSet={auth?.user?.profile?.picture + ",/user.svg"}
                    srcSet={"/user.svg"}
                    size="medium"
                    className="cursor-pointer"
                    alt={auth?.user?.profile?.name}
                />
            </ESDropdownAnchor>

            <ESDropdownContent className="min-w-32">
                {links.map((item) => (
                    <a
                        href={item.href}
                        key={item.name}
                        className="block px-4 py-2 text-sm text-color-primary text-nowrap"
                        onClick={() => setOpen(!open)}
                    >
                        {item.name}
                    </a>
                ))}
                {/* <div className="right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"></div> */}
            </ESDropdownContent>
        </ESDropdown>
    );
}

function Logo() {
    return (
        <a className="cursor-pointer" href="/">
            <img src="/terranova-logo-simple.png" className="size-spacing-large" />
        </a>
    );
}

interface NavigationProps {
    navigation: undefined | Array<{ name: string; href: string; current: boolean }>;
}
function NavigationItems({ navigation }: NavigationProps) {
    return (
        <div className="flex gap-8 items-center">
            {navigation?.map((item) => (
                <h6 key={item.name}>
                    <a
                        href={item.href}
                        className="light:text-light-copy-alt dark:text-dark-copy-alt"
                        aria-current={item.current ? "page" : undefined}
                    >
                        {item.name}
                    </a>
                </h6>
            ))}
        </div>
    );
}

export function NavBar() {
    const navigation = [{ name: "Terranova", href: "/", current: false }];

    return (
        <nav className="flex items-center gap-x-4 p-2 light:bg-light-primary dark:bg-dark-primary">
            <Logo />
            <NavigationItems navigation={navigation} />
            <ProfileMenu />
        </nav>
    );
}
