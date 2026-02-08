import { apiGetProfile } from '@/api/user.api';
import { DefaultRoles, ENV_CONFIG, MENU_ITEMS } from '@/constants';
import { useAppDispatch, useAppSelector } from '@/stores';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Skeleton, theme as antTheme } from 'antd';
import Drawer from 'antd/lib/drawer';
import Layout from 'antd/lib/layout';
import { get } from 'lodash';
import type { FC } from 'react';
import { Suspense, useEffect, useState } from 'react';
import { Outlet } from 'react-router';

import { setGlobalState } from '@/stores/global.store';
import { setUser } from '@/stores/user.store';

import { filterMenuByRoles } from '@/hooks/usePermission';

import { getGlobalState } from '@/utils/getGlobal';

import { MenuChild, MenuList } from '@/interface/layout';

import Header from './header';
import './index.less';
import MenuComponent from './menu';

const { Sider, Content } = Layout;
const WIDTH = 992;

const LayoutPage: FC = () => {
    const [menuList, setMenuList] = useState<MenuList>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const { device, collapsed } = useAppSelector(state => state.user);
    const token = antTheme.useToken();
    const { roles, permissions } = useAppSelector(state => state.global);

    const isMobile = device === 'MOBILE';
    const dispatch = useAppDispatch();

    useEffect(() => {
        initUserProfile();
    }, []);

    const initUserProfile = async () => {
        setLoading(true);
        try {
            const respProfile: any = await apiGetProfile();
            if (!respProfile?.succeeded) {
                return;
            }
            const roles: string[] = respProfile.data?.roles?.map((role: { code: string }) => role?.code?.toLowerCase()) || [];
            dispatch(
                setGlobalState({
                    roles: roles,
                    userProfileInfo: {
                        ...get(respProfile, 'data', {}),
                    },
                }),
            );
        } catch {
        } finally {
            setLoading(false);
        }
    };

    const toggle = () => {
        dispatch(
            setUser({
                collapsed: !collapsed,
            }),
        );
    };

    const initMenuListAll = (menu: MenuList) => {
        const MenuListAll: MenuChild[] = [];

        menu.forEach(m => {
            if (!m?.children?.length) {
                MenuListAll.push(m);
            } else {
                m?.children.forEach(mu => {
                    MenuListAll.push(mu);
                });
            }
        });

        return MenuListAll;
    };

    const fetchMenuList = () => {
        const menus = roles?.includes(DefaultRoles.SUPER_ADMIN.toLowerCase()) ? MENU_ITEMS : filterMenuByRoles(MENU_ITEMS, permissions);
        setMenuList(menus);
        dispatch(
            setUser({
                menuList: initMenuListAll(menus),
            }),
        );
    };

    useEffect(() => {
        fetchMenuList();
    }, [permissions, roles]);

    useEffect(() => {
        window.onresize = () => {
            const { device } = getGlobalState();
            const rect = document.body.getBoundingClientRect();
            const needCollapse = rect.width < WIDTH;

            dispatch(
                setUser({
                    device,
                    collapsed: needCollapse,
                }),
            );
        };
    }, [dispatch]);

    if (loading) {
        return <Skeleton />;
    }

    return (
        <Layout className="layout-page">
            <Header collapsed={collapsed} toggle={toggle} />
            <Layout>
                {!isMobile ? (
                    <Sider
                        className="layout-page-sider"
                        trigger={null}
                        collapsible
                        width={230}
                        style={{ backgroundColor: token.token.colorBgContainer }}
                        collapsedWidth={isMobile ? 0 : 80}
                        collapsed={collapsed}
                        breakpoint="md"
                    >
                        <div onClick={toggle}>
                            <span id="sidebar-trigger">{collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}</span>
                        </div>
                        <div className="sidebar-content">
                            <MenuComponent menuList={menuList} />
                            {!collapsed && <div id="sidebar-license" dangerouslySetInnerHTML={{ __html: ENV_CONFIG.LICENSE_INFO }} />}
                        </div>
                    </Sider>
                ) : (
                    <Drawer
                        width="230"
                        placement="left"
                        styles={{ body: { padding: 0, height: '100%' } }}
                        closable={false}
                        onClose={toggle}
                        open={!collapsed}
                    >
                        <MenuComponent menuList={menuList} />
                    </Drawer>
                )}
                <Content className="layout-page-content">
                    <div className="h-full pt-4">
                        <Suspense fallback={null}>
                            <Outlet />
                        </Suspense>
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};

export default LayoutPage;
