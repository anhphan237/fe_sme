import { AppRouters, DefaultTenantCode } from '@/constants';
import { localeConfig, useLocale } from '@/i18n';
import { useAppSelector } from '@/stores';
import { GlobalOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import LogoutOutlined from '@ant-design/icons/LogoutOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';
import { Button, Image, Space, theme as antTheme } from 'antd';
import Dropdown from 'antd/lib/dropdown/dropdown';
import Layout from 'antd/lib/layout';
import clsx from 'clsx';
import type { FC } from 'react';
import { Suspense, lazy, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { setUser } from '@/stores/user.store';

import useLogout from '@/hooks/useLogout';

import UserIcon from '@/assets/header/profile.svg';
import usIconSrc from '@/assets/icons/us.svg';
import vnIconSrc from '@/assets/icons/vn.svg';
import LogoExps from '@/assets/logo/exps-removebg.png';
import LogoLTBMA from '@/assets/logo/ltbma.png';
import LogoQCLD from '@/assets/logo/qcld.png';
import LogoTDP from '@/assets/logo/tdp.jpg';

const MainBreadCrumb = lazy(() => import('@/components/bread-crumb/MainBreadCrumb'));

const LanguageSwitcher = () => {
    const dispatch = useDispatch();
    const { locale } = useLocale();

    const handleMenuClick = (key: keyof typeof localeConfig) => {
        dispatch(
            setUser({
                locale: key as any,
            }),
        );
    };

    return (
        <Space
            align="center"
            direction="horizontal"
            classNames={{
                item: 'flex items-center',
            }}
        >
            <Dropdown
                menu={{
                    items: [
                        {
                            key: '1',
                            icon: <Image width={24} preview={false} src={vnIconSrc} />,
                            label: <span className="ml-2">Tiếng Việt</span>,
                            onClick: () => handleMenuClick('vi_VN'),
                        },
                        {
                            key: '2',
                            icon: <Image width={24} preview={false} src={usIconSrc} />,
                            label: <span className="ml-2">English</span>,
                            onClick: () => handleMenuClick('en_US'),
                        },
                    ],
                }}
            >
                <Button
                    icon={
                        <>
                            <GlobalOutlined className="hidden md:block" />
                            <Image rootClassName="block md:hidden" width={24} preview={false} src={locale === 'en' ? usIconSrc : vnIconSrc} />
                        </>
                    }
                    className="px-2"
                >
                    <span className="!hidden md:!inline-block">{locale === 'en' ? 'English' : 'Tiếng Việt'}</span>
                </Button>
            </Dropdown>
        </Space>
    );
};
interface HeaderProps {
    collapsed: boolean;
    toggle: () => void;
}

const Header: FC<HeaderProps> = ({ collapsed, toggle }) => {
    const { logged, device } = useAppSelector(state => state.user);
    const { userProfileInfo: currentUser } = useAppSelector(state => state.global) ?? {};
    const navigate = useNavigate();
    const token = antTheme.useToken();
    const { t } = useLocale();
    const { handleLogout } = useLogout();

    const appLogo = useMemo(() => {
        switch (currentUser?.tenant?.code) {
            case DefaultTenantCode.LTBMA:
                return LogoLTBMA;
            case DefaultTenantCode.QCLD:
                return LogoQCLD;
            case DefaultTenantCode.TDP:
                return LogoTDP;
            default:
                return LogoExps;
        }
    }, [currentUser]);

    const toLogin = () => {
        navigate(AppRouters.LOGIN);
    };

    return (
        <Layout.Header className="layout-page-header bg-2" style={{ backgroundColor: token.token.colorBgContainer }}>
            {device !== 'MOBILE' && (
                <div className="logo" style={{ width: collapsed ? 80 : 200 }}>
                    <img
                        src={appLogo}
                        alt="logo"
                        className={clsx('w-20', {
                            'px-1': collapsed,
                        })}
                        style={{ marginRight: collapsed ? '2px' : '20px' }}
                    />
                </div>
            )}
            <div className="layout-page-header-main">
                {device !== 'MOBILE' ? (
                    <Suspense fallback={<>...</>}>
                        <MainBreadCrumb />
                    </Suspense>
                ) : (
                    <div onClick={toggle}>
                        <span id="sidebar-trigger">{collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}</span>
                    </div>
                )}
                <h1 className="grow text-center" />
                <LanguageSwitcher />
                <div className="actions">
                    {logged ? (
                        <Dropdown
                            menu={{
                                items: [
                                    {
                                        key: '1',
                                        icon: <UserOutlined />,
                                        label: <span>{t('header.avatar.account')}</span>,
                                        onClick: () => navigate(AppRouters.DASHBOARDS),
                                    },
                                    {
                                        key: '2',
                                        icon: <LogoutOutlined />,
                                        label: <span>{t('header.avatar.logout')}</span>,
                                        onClick: () => handleLogout(),
                                    },
                                ],
                            }}
                            trigger={['click']}
                        >
                            <span className="user-action">
                                <img src={UserIcon} className="user-avatar" alt="avatar" />
                            </span>
                        </Dropdown>
                    ) : (
                        <span style={{ cursor: 'pointer' }} onClick={toLogin}>
                            {t('global.tips.login')}
                        </span>
                    )}
                </div>
            </div>
        </Layout.Header>
    );
};

export default Header;
