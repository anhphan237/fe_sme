import { EventTypes, ToastMessageStatus } from '@/constants';
import { useLocale } from '@/i18n';
import { eventBus } from '@/utils/eventBus';
import message from 'antd/es/message';
import { useEffect } from 'react';

export const notify = {
    success: (message: string) => {
        eventBus.emit(EventTypes.SHOW_MESSAGE, { type: ToastMessageStatus.SUCCESS, message });
    },

    error: (message: string) => {
        eventBus.emit(EventTypes.SHOW_MESSAGE, { type: ToastMessageStatus.ERROR, message });
    },
    warning: (message: string) => {
        eventBus.emit(EventTypes.SHOW_MESSAGE, { type: ToastMessageStatus.WARNING, message });
    },
    info: (message: string) => {
        eventBus.emit(EventTypes.SHOW_MESSAGE, { type: ToastMessageStatus.INFO, message });
    },
};

const ToastMessage = () => {
    const { t } = useLocale();
    const [messageApi, contextHolder] = message.useMessage();

    useEffect(() => {
        eventBus.on(EventTypes.SHOW_MESSAGE, onShowMessage);

        return () => {
            eventBus.off(EventTypes.SHOW_MESSAGE, onShowMessage);
        };
    }, []);

    const onShowMessage = (data: { message: string; type: ToastMessageStatus }) => {
        if (data.type === ToastMessageStatus.ERROR) {
            messageApi.error(t(data.message));
        } else if (data.type === ToastMessageStatus.SUCCESS) {
            messageApi.success(t(data.message));
        } else if (data.type === ToastMessageStatus.WARNING) {
            messageApi.warning(t(data.message));
        } else if (data.type === ToastMessageStatus.INFO) {
            messageApi.info(t(data.message));
        }
    };

    return <>{contextHolder}</>;
};
export default ToastMessage;
