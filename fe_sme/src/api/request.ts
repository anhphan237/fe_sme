import { APP_CONFIG, AppRouters, ENV_CONFIG } from '@/constants';
import store from '@/stores';
import type { AxiosRequestConfig, Method } from 'axios';
import axios from 'axios';
import registerAxiosTokenRefresh from 'axios-token-refresh';

import { notify } from '@/components/toast-message';

import { setGlobalState } from '@/stores/global.store';

export interface RequestConfig extends AxiosRequestConfig {
    loading?: boolean;
}
export type ParamsGetList = {
    pageNumber: number;
    pageSize: number;
    search?: string;
    searchValue?: string;
    filters?: { key: string; value: string[] | number[] }[];
    range?: { from?: string; to?: string };
    filter?: {
        searchValue?: string;
        range?: { from?: string; to?: string };
    };
    debtDocumentId?: string;
    invoiceId?: string;
    contractId?: string;
    customerId?: string;
    supplierId?: string;
    isChecked?: boolean;
    isIncome?: boolean;
    isPurchaseReturn?: boolean;
    isOrderReturn?: boolean;
    Type?: number[];
};
const axiosInstance = axios.create({
    baseURL: `${ENV_CONFIG.API}/${ENV_CONFIG.API_VERSION}`,
    headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
    },
    withCredentials: false,
});
registerAxiosTokenRefresh(axiosInstance, {
    refreshRequest: (failedRequest: any) => {
        // handle refresh token logic here
        window.localStorage.clear();
        window.location.href = AppRouters.LOGIN;
        return Promise.reject(failedRequest);
    },
});

axiosInstance.interceptors.request.use(
    (config: RequestConfig) => {
        if (config.loading !== false) {
            store.dispatch(
                setGlobalState({
                    loading: true,
                }),
            );
        }

        const token = localStorage.getItem(APP_CONFIG.ACCESS_TOKEN);

        config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token?.trim()}`,
        };

        return config;
    },
    error => {
        store.dispatch(
            setGlobalState({
                loading: false,
            }),
        );
        Promise.reject(error);
    },
);

const checkAuthorize = (error: any) => {
    if (String(error?.data).includes('You are not Authorized') || error?.status === 403) {
        notify.error('global.unauthorized');
        setTimeout(() => {
            window.location.href = AppRouters.LOGIN;
        }, 2000);
    }
};

axiosInstance.interceptors.response.use(
    resp => {
        store.dispatch(
            setGlobalState({
                loading: false,
            }),
        );

        checkAuthorize(resp);

        return resp?.data;
    },
    error => {
        store.dispatch(
            setGlobalState({
                loading: false,
            }),
        );

        checkAuthorize(error);

        return {
            status: false,
            message: error?.message,
            result: null,
        };
    },
);

export type Response<T = any> = {
    status: boolean;
    message: string;
    result: T;
    data?: T;
    [key: string]: any;
};

export type MyResponse<T = any> = Promise<Response<T>>;

/**
 *
 * @param method - request methods
 * @param url - request url
 * @param data - request data or params
 */
export const request = <T = any>(method: Lowercase<Method>, url: string, data?: any, config?: RequestConfig): MyResponse<T> => {
    // const prefix = '/api'
    const prefix = '';

    url = prefix + url;

    if (method === 'post') {
        return axiosInstance.post(url, data, config);
    } else if (method === 'put') {
        return axiosInstance.put(url, data, config);
    } else if (method === 'delete') {
        return axiosInstance.delete(url, config);
    } else {
        return axiosInstance.get(url, {
            params: data,
            ...config,
        });
    }
};
