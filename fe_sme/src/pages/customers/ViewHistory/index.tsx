import { useLocale } from '@/i18n';
import { Tabs } from 'antd';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';

import { setBreadCrumbs } from '@/stores/global.store';

import HistoryOrder from '../../suppliers/SupplierHistory';
import CustomerHistory from '../CustomerHistory';
import HistoryInteraction from '../HistoryInteraction';

const ViewHistory = () => {
    const { id } = useParams<{ id?: string }>();
    const { t } = useLocale();
    const dispatch = useDispatch();
    const [activeKey, setActiveKey] = useState('order');

    useEffect(() => {
        if (!id) return;
        dispatch(
            setBreadCrumbs({
                [id]: t('history.view'),
            }),
        );
    }, [id]);

    return (
        <div className="h-full flex flex-col p-4">
            <Tabs
                activeKey={activeKey}
                onChange={(key: string) => {
                    setActiveKey(key);
                }}
                type="card"
                items={[
                    {
                        label: t('history.order'),
                        key: 'order',
                        children: <HistoryOrder />,
                    },
                    {
                        label: t('history.purchase'),
                        key: 'purchase',
                        children: <CustomerHistory />,
                    },
                    {
                        label: t('history.interaction'),
                        key: 'interaction',
                        children: <HistoryInteraction customerId={id} />,
                    },
                ]}
            />
        </div>
    );
};

export default ViewHistory;
