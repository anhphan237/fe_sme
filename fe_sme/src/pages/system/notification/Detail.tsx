import { getNotificationDetail } from '@/api/notification.api';
import { NOTIFICATION_LABEL, NOTIFICATION_TYPE } from '@/constants';
import BaseModal from '@/core/components/Modal/BaseModal';
import { useLocale } from '@/i18n';
import { faUser, faUserGroup } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useQuery } from '@tanstack/react-query';
import { Avatar, List } from 'antd';

import { notify } from '@/components/toast-message';

import { formatDateTime } from '@/utils/format-datetime';

import { NotificationItem } from '@/interface/notification';

export interface DetailProps {
    title?: string;
    visible: boolean;
    setVisible: (visible: boolean) => void;
    notificationId?: string | null;
}
const { t } = useLocale();

const Detail = ({ title = t('notify.detail'), notificationId, visible, setVisible }: DetailProps) => {
    const { data, isLoading, isFetching, error } = useQuery({
        queryKey: ['getDetailNotification', notificationId],
        queryFn: async () => {
            if (!notificationId) {
                throw new Error(t('notify.error.fetch'));
            }
            const response = (await getNotificationDetail(notificationId)) as unknown as { succeeded?: boolean; data: NotificationItem };
            if (!response?.succeeded) throw new Error(t('notify.error.fetch'));
            return response?.data;
        },
        enabled: !!notificationId,
    });

    const onClose = () => {
        setVisible(false);
    };

    if (error) {
        notify.error(t('notify.message'));
        return null;
    }

    return (
        <BaseModal loading={isLoading || isFetching} title={title} open={visible} onCancel={onClose} footer={null} destroyOnClose centered>
            <List
                dataSource={data ? [data] : []}
                renderItem={item => (
                    <List.Item className={!item.users?.[0]?.isRead ? t('notify.unread') : ''}>
                        <List.Item.Meta
                            avatar={
                                <Avatar icon={<FontAwesomeIcon icon={item.notificationType === NOTIFICATION_TYPE.USER ? faUser : faUserGroup} />} />
                            }
                            title={
                                <div>
                                    <strong>{item.title}</strong>
                                    <div>{NOTIFICATION_LABEL.TARGET_TYPE[item.targetType] || t('notify.unknown')}</div>
                                </div>
                            }
                            description={
                                <>
                                    <div>{item.contentNotify}</div>
                                    {item.users?.[0]?.created && <small>{formatDateTime(item.users[0].created)}</small>}
                                </>
                            }
                        />
                    </List.Item>
                )}
            />
        </BaseModal>
    );
};

export default Detail;
