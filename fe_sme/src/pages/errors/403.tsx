import { AppRouters } from '@/constants';
import { useLocale } from '@/i18n';
import Button from 'antd/es/button';
import Result from 'antd/es/result';

const NoPermissionPage: React.FC = () => {
    const { t } = useLocale();

    return (
        <Result
            status="403"
            title="403"
            subTitle={t('global.tips.unauthorized')}
            extra={
                <Button type="primary" onClick={() => {
                    window.location.href = `${AppRouters.LOGIN}${'?from=/'}`
                }}>
                    {t('global.tips.goToLogin')}
                </Button>
            }
        />
    );
};

export default NoPermissionPage;
