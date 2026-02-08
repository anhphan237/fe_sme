import { FormattedMessage } from "react-intl";

export const NOTIFICATION_TYPE = {
    GROUP: 0,
    USER: 1,
} as const;
export type NOTIFICATION_TYPE = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

export const NOTIFICATION_TARGET_TYPE = {
    ZALO: 0,
    EMAIL: 1,
    BELL: 2,
} as const;
export type NOTIFICATION_TARGET_TYPE = (typeof NOTIFICATION_TARGET_TYPE)[keyof typeof NOTIFICATION_TARGET_TYPE];

export const NOTIFICATION_LABEL = {
    TYPE: {
        [NOTIFICATION_TYPE.GROUP]: <FormattedMessage id="notification.group" defaultMessage="Group" />,
        [NOTIFICATION_TYPE.USER]: <FormattedMessage id="notification.user" defaultMessage="User" />,
    },
    TARGET_TYPE: {
        [NOTIFICATION_TARGET_TYPE.ZALO]: <FormattedMessage id="notification.zalo" defaultMessage="Zalo" />,
        [NOTIFICATION_TARGET_TYPE.EMAIL]: <FormattedMessage id="notification.email" defaultMessage="Email" />,
        [NOTIFICATION_TARGET_TYPE.BELL]: <FormattedMessage id="notification.system" defaultMessage="System" />,
    }
}
