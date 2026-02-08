export const ENV_CONFIG = {
    API: import.meta.env.VITE_API_DOMAIN,
    GOOGLE_API_KEY: import.meta.env.VITE_GOOGLE_API_KEY,
    STORAGE: `${import.meta.env.VITE_API_DOMAIN}/Storage/`,
    API_VERSION: import.meta.env.VITE_API_VERSION,
    LICENSE_INFO: import.meta.env.VITE_LICENSE_INFO,
};

export const APP_CONFIG = {
    ACCESS_TOKEN: 'ACCESS_TOKEN',
    DEBT_INFO: 'DEBT_INFO',
    WAREHOUSE_INFO: 'WAREHOUSE_INFO',
};

export enum EventTypes {
    SHOW_MESSAGE = 'SHOW_MESSAGE',
}

export enum ToastMessageStatus {
    SUCCESS = 'SUCCESS',
    ERROR = 'ERROR',
    WARNING = 'WARNING',
    INFO = 'INFO',
}

export const RegexValidate = {
    EMAIL: /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    USERNAME: /^(?=[a-zA-Z0-9._]{8,20}$)(?!.*[_.]{2})[^_.].*[^_.]$/,
    PHONE: /^0[0-9]{9,10}$/,
    POSITIVE_INTEGER: /^[1-9][0-9]*$/,
    INTEGER: /^[0-9][0-9]*$/,
    EMAIL_OR_PHONE: /^(?:\+?\d{1,4}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}$|^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/,
    USERNAME_OR_PHONE: /^(?=[a-zA-Z0-9._]{8,20}$)(?!.*[_.]{2})[^_.].*[^_.]$|^(?:\+?\d{1,4}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}$/,
    CCCD: /^\d{12}$/,
    TAX_CODE: /^\d{10}(-\d{3})?$/,
    QUANTITY_PARSE_PATTERN: /\$\s?|(,*)/g,
};

export enum DefaultValues {
    PAGE_SIZE = 10,
    DEBOUNCE_DELAY = 500,
}

export const DashboardDefaultDatetimeFormat = 'DD-MM-YYYY';

export const FilterDashboardDataDatetimeFormat = 'YYYY-MM-DDTHH:mm:ss.SSSS';
