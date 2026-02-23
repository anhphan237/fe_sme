import { gatewayLogin } from '@/api/gateway/auth.gateway';
import { APP_CONFIG } from '@/constants';
import { useLocale } from '@/i18n';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { notify } from '@/components/toast-message';

import { setUser } from '@/stores/user.store';

import { formatSearch } from '@/utils/formatSearch';

import { LoginParams } from '@/interface/user';

const useLogin = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { t } = useLocale();

    const [ipAddress, setIPAddress] = useState('');
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        localStorage.clear();
        setLoading(true);
        fetch('https://api.ipify.org/?format=json')
            .then(response => response.json())
            .then(data => {
                setLoading(false);
                setIPAddress(data.ip);
            })
            .catch(error => {});
    }, []);

    const handleLogin = async (form: LoginParams) => {
        setLoading(true);
        try {
            const res = await gatewayLogin(form.account, form.password, { loading: false });

            // Gateway response has been mapped to old format by the interceptor
            if (res.status) {
                const data = res?.result || res?.data;

                // Store the access token
                localStorage.setItem(APP_CONFIG.ACCESS_TOKEN, data.accessToken);

                // Store tenant ID for future Gateway requests
                if (form.tenantId) {
                    localStorage.setItem('TENANT_ID', form.tenantId);
                }

                dispatch(
                    setUser({
                        logged: true,
                    }),
                );
                const search = formatSearch(location.search);
                const from = search.from || { pathname: '/dashboards' };
                navigate(from);
            } else {
                notify.error(t('global.login.invalid'));
            }
        } catch {
            notify.error(t('global.login.invalid'));
        } finally {
            setLoading(false);
        }
    };

    return { handleLogin, loading, ipAddress };
};

export default useLogin;
