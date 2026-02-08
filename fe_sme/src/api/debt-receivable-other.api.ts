import { DebtReceivableOtherRequest } from '@/interface/debt-receivable-other';

import { ParamsGetList, RequestConfig, request } from './request';

export const apiSearchDebtReceivableOther = (params: ParamsGetList, configs?: RequestConfig) =>
    request('post', '/DebtReceivableOther/search', params, configs);

export const apiGetDebtReceivableOtherById = (id: string, configs?: RequestConfig) =>
    request('get', `/DebtReceivableOther/${id}`, undefined, configs);

export const apiCreateDebtReceivableOther = (data: DebtReceivableOtherRequest) =>
    request('post', '/DebtReceivableOther', {
        payload: data,
    });

export const apiUpdateDebtReceivableOther = (data: DebtReceivableOtherRequest) => request('put', '/DebtReceivableOther', { payload: data });

export const apiDeleteDebtReceivableOther = (id: string) => request('delete', `/DebtReceivableOther/${id}`);
