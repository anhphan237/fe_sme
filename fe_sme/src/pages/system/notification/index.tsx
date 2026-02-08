import { getNotificationList } from '@/api/notification.api';
import { NOTIFICATION_LABEL, NOTIFICATION_TARGET_TYPE, NOTIFICATION_TYPE } from '@/constants';
import { useLocale } from '@/i18n';
import { useQuery } from '@tanstack/react-query';
import Column from 'antd/es/table/Column';
import { useState } from 'react';

import NotificationTable from '@/components/table';

import { NotificationItem, NotificationListResponse } from '@/interface/notification';

import Detail from './Detail';

const Notification = () => {
    const { t } = useLocale();
    const [detailNotificationId, setDetailNotificationId] = useState<string | null>(null);
    const [filter, setFilter] = useState({
        pageSize: 10,
        pageNumber: 1,
    });

    const { data } = useQuery({
        queryKey: ['getNotificationList'],
        queryFn: async () => {
            const response = (await getNotificationList({
                pageNumber: 1,
                pageSize: 10,
            })) as unknown as NotificationListResponse;
            return response;
        },
    });
    return (
        <div className=" h-full p-5">
            <NotificationTable<NotificationItem>
                dataSource={data?.data || []}
                rowKey={record => record.id}
                wrapClassName="!h-full w-full"
                scroll={{ x: 'max-content', y: 'calc(100vh - 232px)' }}
                pagination={{
                    current: filter.pageNumber,
                    pageSize: filter.pageSize,
                    total: data?.totalItems,
                    onChange: (page, pageSize) => {
                        setFilter({ ...filter, pageNumber: page, pageSize });
                    },
                }}
            >
                <Column
                    title={<div className="flex items-center justify-center">{t('category.list.index')}</div>}
                    dataIndex="index"
                    key="index"
                    render={(_, __, index: number) => (
                        <div className="flex items-center justify-center mb-0">{(filter.pageNumber - 1) * filter.pageSize + (index + 1)}</div>
                    )}
                />
                <Column
                    title={t('notification.name')}
                    dataIndex="title"
                    key="title"
                    className="min-w-[300px]"
                    render={(title, record) => {
                        return (
                            <div className="text-blue-500 font-medium">
                                <span className="cursor-pointer hover:underline" onClick={() => setDetailNotificationId(record.id)}>
                                    {title}
                                </span>
                            </div>
                        );
                    }}
                />
                <Column title={t('notification.content')} dataIndex="contentNotify" className="min-w-[450px]" key="contentNotify" />
                <Column
                    title={t('notification.content_type')}
                    dataIndex="notificationType"
                    className="min-w-[150px]"
                    key="notificationType"
                    render={value => <div>{NOTIFICATION_LABEL.TYPE[value as NOTIFICATION_TYPE]}</div>}
                />
                <Column
                    title={t('notification.target_type')}
                    dataIndex="targetType"
                    className="min-w-[250px]"
                    key="targetType"
                    render={value => <div>{NOTIFICATION_LABEL.TARGET_TYPE[value as NOTIFICATION_TARGET_TYPE]}</div>}
                />
            </NotificationTable>
            <Detail
                notificationId={detailNotificationId}
                visible={!!detailNotificationId}
                setVisible={val => !val && setDetailNotificationId(null)}
            />
        </div>
    );
};

export default Notification;
