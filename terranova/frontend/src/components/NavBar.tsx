import { PktsDropdown, PktsAvatar } from "@esnet/packets-ui-react";
import { useState } from "react";
import { useAuth } from "react-oidc-context";
import { Link } from "react-router-dom";

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
        <PktsDropdown
            anchor={
                <PktsAvatar
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
        </PktsDropdown>
    );
}

function Logo() {
    return (
        <Link className="cursor-pointer" to="/">
            <img src="/terranova-logo-simple.png" className="size-spacing-large" />
        </Link>
    );
}

interface NavigationProps {
    navigation: undefined | Array<{ name: string; href: string; current: boolean }>;
}
function NavigationItems({ navigation }: NavigationProps) {
    return (
        <div className="flex gap-8 items-center">
            {navigation?.map((item) => (
                <h6 key={item.name} className="pb-0">
                    <Link
                        to={item.href}
                        className="text-light-copyAlt dark:text-dark-copyAlt text-2xl no-underline"
                        aria-current={item.current ? "page" : undefined}
                    >
                        {item.name}
                    </Link>
                </h6>
            ))}
        </div>
    );
}

export function NavBar() {
    const navigation = [{ name: "Terranova", href: "/", current: false }];

    return (
        <nav className="flex justify-between items-center py-2 px-2 bg-light-primary">
            <div className="flex gap-x-4">
                <Logo />
                <NavigationItems navigation={navigation} />
            </div>
            <ProfileMenu />
        </nav>
    );
}
