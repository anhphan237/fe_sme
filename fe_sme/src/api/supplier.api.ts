import { IHistorySupplierInteraction } from '@/interface/supplier';

import { ParamsGetList, RequestConfig, request } from './request';

export const apiSearchSupplierInfo = (params: ParamsGetList, configs?: RequestConfig) => request('post', '/Supplier/search', params, configs);
export const apiGetDetailSupplierInfo = (id: string, configs?: RequestConfig) => request('get', `/Supplier/${id}`, null, configs);
export const apiAddSupplierInfo = (data: any) => request('post', '/Supplier', data);
export const apiUpdateSupplierInfo = (data: any) => request('put', '/Supplier', data);
export const apiDeleteSupplierInfo = (id: string) => request('delete', `/Supplier/${id}`);

export const apiGrantSupplierPersonInCharge = (data: any) =>
    request('post', '/Supplier/supplier-person-in-charge', {
        payload: data,
    });

export const apiSearchSupplierTracking = (params: ParamsGetList, configs?: RequestConfig) =>
    request<IHistorySupplierInteraction[]>('post', '/SupplierTracking/search', params, configs);
export const apiSearchSupplierTrackingById = (params: ParamsGetList, configs?: RequestConfig) =>
    request<IHistorySupplierInteraction[]>('post', '/Supplier/supplier-trackings', params, configs);
export const apiAddSupplierTracking = (data: IHistorySupplierInteraction) =>
    request('post', '/SupplierTracking', {
        payload: data,
    });
export const apiUpdateSupplierTracking = (data: IHistorySupplierInteraction) => request('put', '/SupplierTracking', { payload: data });

export const apiSearchSupplierHistory = (params: ParamsGetList, configs?: RequestConfig) =>
    request('post', '/Supplier/supplier-histories/search', params, configs);
