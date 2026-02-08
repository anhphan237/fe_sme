import { IDebtTransaction, IDebtTransactionRequest } from '@/interface/debt-receivables';

import { ParamsGetList, RequestConfig, request } from './request';

export const apiGetDebtTransactions = (params: ParamsGetList, configs?: RequestConfig) =>
    request<IDebtTransaction[]>('get', '/DebtTransaction', params, configs);

export const apiSearchDebtTransactions = (params: ParamsGetList, configs?: RequestConfig) =>
    request<IDebtTransaction[]>('post', '/DebtTransaction/search', params, configs);

export const apiSearchDebtTransactionCustomers = (params: ParamsGetList, configs?: RequestConfig) =>
    request('post', '/DebtTransaction/customers/search', params, configs);

export const apiGetDebtTransactionById = (id: string, config?: RequestConfig) =>
    request<IDebtTransaction>('get', `/DebtTransaction/${id}`, {}, config);

export const apiCreateDebtTransaction = (data: IDebtTransactionRequest[], config?: RequestConfig) =>
    request('post', '/DebtTransaction', { payload: data }, { ...config, loading: false });

export const apiUpdateDebtTransaction = (data: IDebtTransactionRequest, config?: RequestConfig) =>
    request('put', '/DebtTransaction', { payload: data }, { ...config, loading: false });

export const apiDeleteDebtTransaction = (id: string) => request('delete', `/DebtTransaction/${id}`);

export const apiSearchDebtTransactionsPayable = (params: ParamsGetList, configs?: RequestConfig) =>
    request<IDebtTransaction[]>('post', '/DebtPayable/transaction/search', params, configs);

export const apiCreateDebtTransactionPayable = (data: IDebtTransactionRequest[], config?: RequestConfig) =>
    request('post', '/DebtPayable/transaction', { payload: data }, { ...config, loading: false });

export const apiDeleteDebtTransactionPayable = (id: string) => request('delete', `/DebtPayable/transaction/${id}`);
