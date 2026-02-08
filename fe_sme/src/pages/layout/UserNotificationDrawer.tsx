import { getNotificationByUser, notificationMarkAsRead } from '@/api/notification.api';
import { useLocale } from '@/i18n';
import { useAppSelector } from '@/stores';
import { useQuery } from '@tanstack/react-query';
import { Drawer, Spin, Typography } from 'antd';
import { useState } from 'react';

import BaseButton from '@/components/button';

import { NotificationItem, NotificationListResponse } from '@/interface/notification';

import NoticeCard from './NoticeCard';

interface UserNotificationDrawerProps {
    totalUnread?: number;
    open: boolean;
    setOpen: (val: boolean) => void;
    handleMarkAsRead: (item: NotificationItem) => Promise<void>;
}
const UserNotificationDrawer = ({ totalUnread, open, setOpen, handleMarkAsRead }: UserNotificationDrawerProps) => {
    const { t } = useLocale();
    const userProfile = useAppSelector(state => state.global.userProfileInfo);
    const [filters, setFilters] = useState<{ pageSize: number; pageNumber: number }>({
        pageSize: 10,
        pageNumber: 1,
    });

    const { data, isLoading, isFetching, isError, refetch } = useQuery({
        queryKey: ['getNotificationByUser', userProfile?.id, filters],
        queryFn: async () => {
            const response = (await getNotificationByUser({ ...filters, userId: userProfile?.id })) as unknown as NotificationListResponse;
            return response;
        },
        enabled: Boolean(userProfile?.id && open),
    });

    const markAsRead = async (item: NotificationItem) => {
        if (item?.isRead) return;
        try {
            await handleMarkAsRead(item);
            refetch();
        } catch {}
    };

    return (
        <Drawer
            title={t('notification.title')}
            placement="right"
            width={450}
            onClose={() => setOpen(false)}
            open={open}
            styles={{
                body: { padding: 16 },
            }}
            extra={
                data?.totalItems ? (
                    <Typography.Text>
                        {totalUnread ? (
                            <>
                                <Typography.Text className="font-bold text-red-500">{totalUnread}</Typography.Text>/
                            </>
                        ) : null}
                        <Typography.Text className="font-bold">{data?.totalItems}</Typography.Text>
                    </Typography.Text>
                ) : null
            }
            className="user-notification-drawer"
            maskClosable={false}
        >
            <Spin spinning={isLoading || isFetching} className="w-full h-full flex items-center justify-center">
                <div className="flex flex-col gap-2">
                    {isError ? (
                        <div className="text-red-500 text-center">{t('global.error_occurred')}</div>
                    ) : (
                        data?.data.map(item => (
                            <NoticeCard
                                key={item.id}
                                item={item}
                                contentClassName="visible whitespace-normal text-clip"
                                infoClassName="max-w-none"
                                onClick={() => markAsRead(item)}
                            />
                        ))
                    )}
                    {data?.totalItems && data?.totalItems > filters.pageSize && (
                        <BaseButton
                            className="mt-4 w-full"
                            type="primary"
                            onClick={() => {
                                setFilters(prev => ({ ...prev, pageNumber: prev.pageNumber + 1 }));
                                refetch();
                            }}
                            disabled={isLoading || isFetching}
                            label={t('global.load_more')}
                        />
                    )}
                </div>
            </Spin>
        </Drawer>
    );
};

export default UserNotificationDrawer;
