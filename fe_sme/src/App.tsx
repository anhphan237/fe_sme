import { ConfigProvider, theme as antdTheme } from 'antd';
import en_US from 'antd/lib/locale/en_US';
import vi_VN from 'antd/lib/locale/vi_VN';
import Spin from 'antd/lib/spin';
import { Suspense, useEffect } from 'react';
import { FormattedMessage, IntlProvider } from 'react-intl';

import { HistoryRouter, history } from '@/routes/history';

import ToastMessage from './components/toast-message';
import { APP_CONFIG } from './constants';
import { localeConfig } from './i18n';
import RenderRouter from './routes';
import { useAppDispatch, useAppSelector } from './stores';
import { setGlobalState } from './stores/global.store';
import { registerExportWorker, registerImportWorker } from './stores/workers.store';
import { parseJwt } from './utils/helpers';

const FormatMsg: any = FormattedMessage;

const App: React.FC = () => {
    const { locale, logged } = useAppSelector(state => state.user);
    const { theme, loading } = useAppSelector(state => state.global);
    const workerStore = useAppSelector(state => state.worker);
    const dispatch = useAppDispatch();

    useEffect(() => {
        const detectUserInfo = () => {
            const accessToken = localStorage.getItem(APP_CONFIG.ACCESS_TOKEN);
            if (!accessToken) return;
            const jwtPayload = parseJwt(accessToken);
            if (jwtPayload) {
                dispatch(
                    setGlobalState({
                        permissions: jwtPayload.permission,
                    }),
                );
            }
        };
        window.addEventListener('storage', detectUserInfo);
        detectUserInfo();
    }, [logged]);

    useEffect(() => {
        const importWorker = new Worker(new URL('@workers/importWorker.js', import.meta.url));
        const exportWorker = new Worker(new URL('@workers/exportWorker.js', import.meta.url));
        dispatch(registerImportWorker(importWorker));
        dispatch(registerExportWorker(exportWorker));
        return () => {
            if (workerStore.importWorker) {
                workerStore.importWorker.terminate();
            }
            if (workerStore.exportWorker) {
                workerStore.exportWorker.terminate();
            }
        };
    }, []);

    const setTheme = (dark = true) => {
        dispatch(
            setGlobalState({
                // theme: dark ? 'dark' : 'light',
                theme: 'light',
            }),
        );
    };

    /** initial theme */
    useEffect(() => {
        setTheme(theme === 'light');

        // watch system theme change
        if (!localStorage.getItem('theme')) {
            const mql = window.matchMedia('(prefers-color-scheme: light)');

            function matchMode(e: MediaQueryListEvent) {
                setTheme(e.matches);
            }

            mql.addEventListener('change', matchMode);
        }
    }, []);

    const getAntdLocale = () => {
        if (locale === 'vi_VN') {
            return vi_VN;
        } else if (locale === 'en_US') {
            return en_US;
        }
    };

    return (
        <ConfigProvider
            locale={getAntdLocale()}
            componentSize="middle"
            theme={{
                algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
                token: {
                    colorPrimary: '#3684DB',
                    colorLink: '#3684DB',
                    colorSuccess: '#4CAF50',
                    colorWarning: '#FFC107',
                    colorError: '#FF6F61',
                    colorTextHeading: '#031930',
                    colorText: '#223A59',
                    colorTextSecondary: '#758BA5',
                    colorBorder: '#B3D6F9',
                    colorBorderBg: '#D1DDED',
                    colorBgLayout: '#FFFFFF',
                    colorBgBase: '#FFFFFF',
                    colorBgContainer: '#FFFFFF',
                },
            }}
        >
            <IntlProvider locale={locale.split('_')[0]} messages={localeConfig[locale]} onError={() => {}}>
                <HistoryRouter history={history}>
                    <Suspense fallback={null}>
                        <Spin
                            spinning={loading}
                            className="app-loading-wrapper"
                            style={{
                                backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.44)' : 'rgba(255, 255, 255, 0.44)',
                            }}
                            tip={<FormatMsg id="global.tips.loading" />}
                        >
                            <RenderRouter />
                        </Spin>
                    </Suspense>
                </HistoryRouter>
                <ToastMessage />
            </IntlProvider>
        </ConfigProvider>
    );
};

export default App;
