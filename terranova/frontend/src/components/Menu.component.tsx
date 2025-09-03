import { Icon } from "./Icon.component";
import { MenuItemPropsType, MenuItemType, DataControllerContextType } from "../types/mapeditor";
import { useContext } from "react";
import { SidebarDataController } from "./LeftSideBar.component";

export function MenuItem(props: MenuItemPropsType) {
    const { controller, instance: navigationItems } = useContext(
        SidebarDataController
    ) as DataControllerContextType;

    function renderSubItems(curItem: MenuItemType) {
        if (!curItem.subItems) return null;
        if (curItem.collapsible && curItem.collapsed) return null;
        var output = curItem.subItems.map((item: MenuItemType) => {
            if (item.subItems) {
                return <MenuList item={item} key={`menuList-${item.id}`}></MenuList>;
            }
            return <MenuItem item={item} key={`menuItem-${item.id}`}></MenuItem>;
        });
        return <ul className="w-full">{output}</ul>;
    }

    function renderIcon(name: string | undefined) {
        if (!name) return null;
        return <Icon name={name} className="icon align-middle inline hover:bg-transparent"></Icon>;
    }

    function toggle() {
        if (!props.item) props.item = {};
        props.item.collapsed = !props.item.collapsed;
        controller.setInstance({ ...navigationItems });
    }

    function renderCollapseIcon(curItem: MenuItemType) {
        if (!curItem.collapsible) return null;
        var iconName = "chevron-right";
        if (!curItem.collapsed) {
            iconName = "chevron-down";
        }
        return <Icon name={iconName} className="icon btn sm inline hover:bg-transparent"></Icon>;
    }

    function renderItem(item: MenuItemType) {
        if (item.collapsible) {
            return (
                <div className="compound justify-start collapsible" onClick={toggle}>
                    {renderCollapseIcon(item)}
                    <a href={item.href} target={item.target}>
                        {item.text}
                    </a>
                </div>
            );
        }
        return (
            <a href={item.href} target={item.target}>
                {item.text}
            </a>
        );
    }

    return (
        <li className={props.item.className}>
            {renderIcon(props.item.icon)}
            {renderItem(props.item)}
            {renderSubItems(props.item)}
        </li>
    );
}

export function MenuList(props: MenuItemPropsType) {
    return (
        <ul>
            <MenuItem item={props.item}></MenuItem>
        </ul>
    );
}
