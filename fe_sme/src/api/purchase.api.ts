import { ParamsGetList, RequestConfig, request } from './request';

export const apiSearchPurchase = (params: ParamsGetList, configs?: RequestConfig) => request('post', '/Purchase/search', params, configs);

export const apiGetDetailPurchase = (id: string, configs?: RequestConfig) => request('get', `/Purchase/${id}`, undefined, configs);

export const apiCancelPurchase = (id: string, configs?: RequestConfig) => request('post', `/Purchase/cancel/${id}`, {}, configs);

export const apiCreatePurchase = (data: any) => request('post', '/Purchase', { payload: data });

export const apiUpdatePurchase = (data: any) => request('put', '/Purchase', { payload: data });

export const apiDeletePurchase = (id: string) => request('delete', `/Purchase/${id}`);
