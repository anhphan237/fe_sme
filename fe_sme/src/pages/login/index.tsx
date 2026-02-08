import { localeConfig, useLocale } from '@/i18n';
import { GlobalOutlined } from '@ant-design/icons';
import { Button, Dropdown, Space } from 'antd';
import { Image } from 'antd';
import { useDispatch } from 'react-redux';

import { setUser } from '@/stores/user.store';

import usIconSrc from '@/assets/icons/us.svg';
import vnIconSrc from '@/assets/icons/vn.svg';

import CompanyInfoSection from './components/CompanyInfoSection';
import LoginFormSection from './components/LoginFormSection';

const LoginForm: React.FC = () => {
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
                                <Image rootClassName="block" width={24} preview={false} src={locale === 'en' ? usIconSrc : vnIconSrc} />
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

    return (
        <div className="min-h-screen w-full flex relative">
            <div className="grid lg:grid-cols-3 gap-3 lg:mx-5 place-content-center">
                <CompanyInfoSection />
                <LoginFormSection />
            </div>
            <div className="absolute top-3 right-3">
                <LanguageSwitcher />
            </div>
        </div>
    );
};

export default LoginForm;
