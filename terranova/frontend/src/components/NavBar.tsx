import { ESDropdown, ESAvatar } from "@esnet/packets-ui";
import { useState } from "react";
import { useAuth } from "react-oidc-context";

function ProfileMenu() {
    const auth = useAuth();

    const [open, setOpen] = useState(false);
    const links = [
        {
            name: "Settings",
            href: "/settings",
        },
        {
            name: "Sign out",
            href: "/logout",
        },
    ];

    return (
        <ESDropdown
            anchor={
                <ESAvatar
                    srcSet={auth?.user?.profile?.picture ?? "/user.svg"}
                    size="medium"
                    className="cursor-pointer"
                    alt={auth?.user?.profile?.name}
                />
            }
        >
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
                <h6 key={item.name} className="mb-0">
                    <a
                        href={item.href}
                        className="text-light-copyAlt dark:text-dark-copyAlt text-2xl no-underline"
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
        <nav className="flex justify-between items-center p-2 bg-light-primary dark:bg-dark-primary">
            <div className="flex gap-x-4">
                <Logo />
                <NavigationItems navigation={navigation} />
            </div>
            <ProfileMenu />
        </nav>
    );
}
