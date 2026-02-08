import { ParamsGetList, RequestConfig, request } from './request';

export const apiSearchPurchaseReturn = (params: ParamsGetList, configs?: RequestConfig) =>
    request('post', '/PurchasesReturn/search', params, configs);

export const apiGetDetailPurchaseReturn = (id: string, configs?: RequestConfig) => request('get', `/PurchasesReturn/${id}`, undefined, configs);

export const apiCreatePurchaseReturn = (data: any) => request('post', '/PurchasesReturn', { payload: data });

export const apiUpdatePurchaseReturn = (data: any) => request('put', '/PurchasesReturn', { payload: data });

export const apiDeletePurchaseReturn = (id: string) => request('delete', `/PurchasesReturn/${id}`);
