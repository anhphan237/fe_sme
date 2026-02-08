import { RequestConfig, request } from './request';

export const getNotificationList = (params: { pageNumber: number; pageSize: number }, config?: RequestConfig) =>
    request('get', '/Notification', params, { loading: false, ...config });

export interface SendNotificationPayload {
    title: string;
    contentNotify: string;
    referenceData: string;
    targetType: number;
    notificationType: number;
}

export const sendNotificationToUser = (
    body: {
        payload: SendNotificationPayload & {
            userIds: string[];
        };
    },
    config?: RequestConfig,
) => request('post', '/Notification/users', body, { loading: false, ...config });

export const sendNotificationToGroup = (body: { payload: SendNotificationPayload & { groupId: string } }, config?: RequestConfig) =>
    request('post', '/Notification/group', body, { loading: false, ...config });

export const getTopNotification = (config?: RequestConfig) => request('get', '/Notification/top', {}, { loading: false, ...config });

export const notificationMarkAsRead = (ids: string[], config?: RequestConfig) =>
    request('post', `/Notification/mark-as-read`, { payload: { notificationIds: ids } }, { loading: false, ...config });

export const getNotificationByUser = ({ userId, ...params }: { userId: string; pageSize: number; pageNumber: number }, config?: RequestConfig) =>
    request('get', `/Notification/users/${userId}`, params, { loading: false, ...config });

export const getNotificationDetail = (id: string, config?: RequestConfig) =>
    request('get', `/Notification/${id}`, { }, { loading: false, ...config });