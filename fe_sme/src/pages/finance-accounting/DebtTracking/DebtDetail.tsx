import { useLocale } from '@/i18n';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';

import { setBreadCrumbs } from '@/stores/global.store';

import Receivables from '../Receivables';

const DebtDetail = () => {
    const { id } = useParams<{ id?: string }>();
    const { t } = useLocale();
    const dispatch = useDispatch();

    useEffect(() => {
        if (!id) return;
        dispatch(
            setBreadCrumbs({
                [id]: t('finance_accounting.debt_detail'),
            }),
        );
    }, [id]);

    return <Receivables customerId={id} />;
};

export default DebtDetail;
