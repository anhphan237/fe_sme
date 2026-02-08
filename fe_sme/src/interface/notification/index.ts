import { NOTIFICATION_TARGET_TYPE, NOTIFICATION_TYPE } from '@/constants';

export interface UserNotice {
    id: string;
    userId: string;
    notificationId: string;
    isRead: boolean;
    created: string;
}

export interface NotificationItem {
    id: string;
    title: string;
    targetType: NOTIFICATION_TARGET_TYPE;
    notificationType: NOTIFICATION_TYPE;
    contentNotify: string;
    referenceData: string;
    users?: UserNotice[];
    isRead?: boolean;
}

export interface NotificationListResponse {
    pageNumber: number;
    pageSize: number;
    totalItems: number;
    succeeded: boolean;
    message: string | null;
    errorCode: string | null;
    errors: string[] | null;
    data: NotificationItem[];
}

export interface TopNotificationResponse extends Omit<NotificationListResponse, 'data' | 'totalItems' | 'pageNumber' | 'pageSize'> {
    data: {
        listNotification: NotificationItem[];
        totalUnread: number;
    };
}
