import { getTopNotification, notificationMarkAsRead } from '@/api/notification.api';
import { useLocale } from '@/i18n';
import { SIGNAL_METHOD } from '@/signalR/core';
import { useSignalR } from '@/signalR/hooks/useSignalR';
import { faBell, faCheckToSlot } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useQuery } from '@tanstack/react-query';
import { Badge, Dropdown } from 'antd';
import { ItemType } from 'antd/es/menu/interface';
import { useState } from 'react';

import BaseButton from '@/components/button';
import { notify } from '@/components/toast-message';

import { NotificationItem, TopNotificationResponse } from '@/interface/notification';

import NoticeCard from './NoticeCard';
import './Notification.less';
import UserNotificationDrawer from './UserNotificationDrawer';

const Notification = () => {
    const { t } = useLocale();
    const [openDropdown, setOpenDropdown] = useState(false);
    const [openNotificationDrawer, setOpenNotificationDrawer] = useState(false);
    const { sendSignalRMessage } = useSignalR({
        method: SIGNAL_METHOD.HUB_PRIVATE,
        channel: 'ReceiveMessage',
        onReceiveMessage: message => {
            console.log('Received message from signalR:', message);
        },
    });

    const { data, refetch } = useQuery({
        queryKey: ['getTopNotification'],
        queryFn: async () => {
            const response = (await getTopNotification()) as unknown as TopNotificationResponse;
            return response;
        },
    });

    const handleMarkAsRead = async (item: NotificationItem) => {
        if (item?.isRead) return;
        try {
            await notificationMarkAsRead([item.id]);
            refetch();
        } catch (error) {
            notify.error(t('global.error_occurred'));
        }
    };

    const notificationItems = (list: NotificationItem[]) => {
        const results: ItemType[] = [];
        if (!list || list.length === 0) {
            results.push({
                key: 'no-notification',
                label: <div className="p-4 text-center text-gray-500">{t('global.no_data')}</div>,
            });
            return results;
        }

        const notificationItems = list.map(item => {
            const isRead = item.isRead;
            return {
                key: item.id,
                label: <NoticeCard item={item} />,
                onClick: (e: any) => {
                    if (isRead) return;
                    handleMarkAsRead(item);
                    e.stopPropagation();
                },
            };
        });
        results.unshift(...notificationItems);
        return results;
    };

    const handleReadAllTop = () => {
        const listId = data?.data?.listNotification?.map(item => item.id) || [];
        notificationMarkAsRead(listId)
            .then(() => refetch())
            .catch(() => {
                notify.error(t('global.error_occurred'));
            });
    };

    return (
        <>
            <div className="relative inline-flex mx-2">
                <Dropdown
                    menu={{ items: notificationItems(data?.data?.listNotification ?? []), className: '!p-2' }}
                    trigger={['click']}
                    open={openDropdown}
                    rootClassName="pb-8"
                    onOpenChange={setOpenDropdown}
                    dropdownRender={menu => (
                        <div className="notification-dropdown max-h-[320px] overflow-y-auto min-w-[280px] scroll-smooth border border-gray-200 rounded shadow-log mt-2">
                            <div className="flex gap-2 text-2xl bg-white rounded-t px-4 py-1 border-b border-b-gray-200">
                                <span className="grow">{t('notification.title')}</span>
                                <BaseButton
                                    type="text"
                                    icon={<FontAwesomeIcon icon={faCheckToSlot} />}
                                    title={t('notification.mark_as_read')}
                                    onClick={handleReadAllTop}
                                />
                            </div>
                            {menu}
                            <div
                                className={`absolute bottom-0 left-0 p-2 z-10 w-full rounded-b box-border bg-colorPrimary font-semibold text-center text-md text-white cursor-pointer`}
                                onClick={e => {
                                    e.stopPropagation();
                                    setOpenNotificationDrawer(true);
                                    setOpenDropdown(false);
                                }}
                            >
                                {t('notification.view_all')}
                            </div>
                        </div>
                    )}
                >
                    <Badge count={data?.data?.totalUnread} size="small">
                        <FontAwesomeIcon icon={faBell} className="text-secondary cursor-pointer" />
                    </Badge>
                </Dropdown>
            </div>
            <UserNotificationDrawer
                totalUnread={data?.data?.totalUnread}
                open={openNotificationDrawer}
                setOpen={setOpenNotificationDrawer}
                handleMarkAsRead={handleMarkAsRead}
            />
        </>
    );
};

export default Notification;
