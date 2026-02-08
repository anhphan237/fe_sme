import { MENU_CATEGORIES, MENU_ITEMS_BY_CATEGORY, MenuCategoryConfig } from '@/constants';
import { useLocale } from '@/i18n';
import { useAppDispatch, useAppSelector } from '@/stores';
import Menu from 'antd/lib/menu';
import type { FC } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import { setUser } from '@/stores/user.store';

import { MenuList } from '@/interface/layout';

import { CustomIcon } from './customIcon';

interface MenuProps {
    menuList: MenuList;
}

const MenuComponent: FC<MenuProps> = props => {
    const { menuList } = props;
    const { device } = useAppSelector(state => state.user);
    const { t } = useLocale();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const getTitle = (menu: MenuList[0]) => {
        return (
            <span style={{ display: 'flex', alignItems: 'center' }}>
                <CustomIcon type={menu.icon!} />
                <span>{t(menu.label)}</span>
            </span>
        );
    };

    const onMenuClick = (path: string) => {
        navigate(path);
        if (device !== 'DESKTOP') {
            dispatch(setUser({ collapsed: true }));
        }
    };

    const findSelectedKey = (pathname: string) => {
        const allKeys = [...menuList.map(m => m.path || m.code), ...menuList.flatMap(m => m.children?.map(c => c.path) || [])].filter(
            Boolean,
        ) as string[];

        const matched = allKeys.filter(key => pathname.startsWith(key)).sort((a, b) => b.length - a.length)[0];

        return matched ? [matched] : [];
    };

    const groupedMenu = React.useMemo(() => {
        const uncategorized = menuList.filter(item => !item.category);

        const categorized = (Object.keys(MENU_ITEMS_BY_CATEGORY) as Array<keyof typeof MENU_ITEMS_BY_CATEGORY>)
            .map(categoryKey => {
                const categoryItems = MENU_ITEMS_BY_CATEGORY[categoryKey];
                const filteredItems = categoryItems.filter(item => menuList.some(m => m.code === item.code));

                if (filteredItems.length === 0) return null;

                return {
                    category: categoryKey,
                    items: filteredItems,
                    config: MENU_CATEGORIES[categoryKey],
                };
            })
            .filter(Boolean) as Array<{
            category: string;
            items: MenuList;
            config: MenuCategoryConfig;
        }>;

        return { uncategorized, categorized };
    }, [menuList]);

    const renderMenuItem = (menu: MenuList[0]) => {
        return menu.children
            ? {
                  key: menu.code,
                  label: getTitle(menu),
                  popupClassName: 'layout-page-sider-menu__popup',
                  children: menu.children.map(child => ({
                      key: child.path,
                      label: t(child.label),
                  })),
              }
            : {
                  key: menu.path,
                  label: getTitle(menu),
              };
    };

    return (
        <Menu
            selectedKeys={findSelectedKey(location.pathname)}
            onClick={e => onMenuClick(e.key)}
            className="layout-page-sider-menu text-2"
            id="main-menu"
        >
            {groupedMenu.uncategorized.map(menu => (
                <Menu.Item key={menu.path} className="menu-item-standalone">
                    {getTitle(menu)}
                </Menu.Item>
            ))}

            {groupedMenu.uncategorized.length > 0 && groupedMenu.categorized.length > 0 && (
                <Menu.Divider className="menu-category-divider menu-divider-main" />
            )}

            {groupedMenu.categorized.map((group, index) => (
                <React.Fragment key={group.category}>
                    <Menu.ItemGroup
                        title={
                            <div className="menu-category-header">
                                <CustomIcon type={group.config.icon} />
                                <span>{t(group.config.label)}</span>
                            </div>
                        }
                        className={`menu-category menu-category-${group.category.toLowerCase()}`}
                    >
                        {group.items.map(menu => {
                            const item = renderMenuItem(menu);
                            return menu.children ? (
                                <Menu.SubMenu key={item.key} title={item.label} popupClassName={item.popupClassName}>
                                    {item.children?.map((child: any) => <Menu.Item key={child.key}>{child.label}</Menu.Item>)}
                                </Menu.SubMenu>
                            ) : (
                                <Menu.Item key={item.key}>{item.label}</Menu.Item>
                            );
                        })}
                    </Menu.ItemGroup>

                    {index < groupedMenu.categorized.length - 1 && <Menu.Divider className="menu-category-divider" />}
                </React.Fragment>
            ))}
        </Menu>
    );
};

export default MenuComponent;
