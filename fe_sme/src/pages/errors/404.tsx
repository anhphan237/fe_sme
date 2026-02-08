import { useNavigate } from 'react-router-dom';

import { useLocale } from '@/i18n';
import Button from 'antd/es/button';
import Result from 'antd/es/result';

const NotFoundPage: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useLocale();

    return (
        <Result
            status="404"
            title="404"
            subTitle={t('global.tips.notfound')}
            extra={
                <Button type="primary" onClick={() => navigate('/')}>
                    {t('global.tips.backHome')}
                </Button>
            }
        ></Result>
    );
};

export default NotFoundPage;
