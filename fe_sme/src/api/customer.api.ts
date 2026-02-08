import {
    IAddEditCustomerInfo,
    ICustomerPersonInChargeRequest,
    IHistoryInteraction,
    IResCustomerHistory,
    IResHistoryOrder,
} from '@/interface/customer';

import { ParamsGetList, RequestConfig, request } from './request';

export const apiSearchCustomerInfo = (params: ParamsGetList, configs?: RequestConfig) => request('post', '/Customer/search', params, configs);
export const apiSearchSupplierInfo = (params: ParamsGetList, configs?: RequestConfig) => request('post', '/Customer/supplier', params, configs);
export const apiGetDetailCustomerInfo = (id: string, configs?: RequestConfig) => request('get', `/Customer/${id}`, null, configs);
export const apiAddCustomerInfo = (data: IAddEditCustomerInfo) =>
    request('post', '/Customer', {
        payload: data,
    });
export const apiUpdateCustomerInfo = (id: string, data: IAddEditCustomerInfo) => request('put', '/Customer', { payload: { ...data, id } });
export const apiDeleteCustomerInfo = (id: string) => request('delete', `/Customer/${id}`);

export const apiSearchHistoryOrder = (params: ParamsGetList, configs?: RequestConfig) =>
    request<IResHistoryOrder[]>('post', '/Order/history', params, configs);

export const apiSearchCustomerHistory = (params: ParamsGetList, configs?: RequestConfig) =>
    request<IResCustomerHistory[]>('post', '/Customer/customer-histories/search', params, configs);

export const apiSearchHistoryInteraction = (params: ParamsGetList, configs?: RequestConfig) =>
    request<IHistoryInteraction[]>('post', '/CustomerTracking/search', params, configs);
export const apiSearchHistoryInteractionById = (params: ParamsGetList, configs?: RequestConfig) =>
    request<IHistoryInteraction[]>('post', '/Customer/customer-trackings', params, configs);
export const apiAddHistoryInteraction = (data: IHistoryInteraction) =>
    request('post', '/CustomerTracking', {
        payload: data,
    });
export const apiUpdateHistoryInteraction = (data: IHistoryInteraction) => request('put', '/CustomerTracking', { payload: data });

export const apiGrantCustomerPersonInCharge = (data: ICustomerPersonInChargeRequest) =>
    request('post', '/Customer/customer-person-in-charge', {
        payload: data,
    });
