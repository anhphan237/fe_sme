import { ParamsGetList, RequestConfig, request } from './request';

export const apiSearchPurchaseInvoice = (params: ParamsGetList, configs?: RequestConfig) =>
    request('post', '/PurchaseInvoice/search', params, configs);

export const apiGetDetailPurchaseInvoice = (id: string, configs?: RequestConfig) => request('get', `/PurchaseInvoice/${id}`, undefined, configs);

export const apiCreatePurchaseInvoice = (data: any) => request('post', '/PurchaseInvoice', { payload: data });

export const apiUpdatePurchaseInvoice = (data: any) => request('put', '/PurchaseInvoice', { payload: data });

export const apiDeletePurchaseInvoice = (id: string) => request('delete', `/PurchaseInvoice/${id}`);
