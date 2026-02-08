import { IDebtTransaction, IDebtTransactionApprove, IDebtTransactionRequest } from '@/interface/finance-accounting';

import { ParamsGetList, RequestConfig, request } from './request';

export const apiSearchDebtTracking = (params: ParamsGetList, configs?: RequestConfig) =>
    request('post', '/DebtDocument/customers/search', params, configs);
export const apiSearchDebtReceivables = (params: ParamsGetList, configs?: RequestConfig) =>
    request('post', '/DebtDocument/receivable/search', params, configs);
export const apiSearchDebtPayables = (params: ParamsGetList, configs?: RequestConfig) =>
    request('post', '/DebtDocument/payable/search', params, configs);

export const apiSearchReceivables = (params: ParamsGetList, configs?: RequestConfig) => request('post', '/DebtReceivable/search', params, configs);

export const apiSearchPayables = (params: ParamsGetList, configs?: RequestConfig) => request('post', '/DebtPayable/search', params, configs);

export const apiSearchDebtTransaction = (params: ParamsGetList, configs?: RequestConfig) =>
    request<IDebtTransaction[]>('post', '/InvoicePaymentHistory/search', params, configs);
export const apiDeleteTransaction = (id: string) => request('delete', `/InvoicePaymentHistory/${id}`);
export const apiCreateTransaction = (data: IDebtTransaction, config?: RequestConfig) =>
    request(
        'post',
        '/InvoicePaymentHistory',
        {
            payload: data,
        },
        { ...config, loading: false },
    );

export const apiUpdateTransaction = (data: IDebtTransaction, config?: RequestConfig) =>
    request(
        'put',
        '/InvoicePaymentHistory',
        {
            payload: data,
        },
        { ...config, loading: false },
    );

export const apiRequestApproveTransaction = (data: IDebtTransactionRequest) => {
    return request('post', `/InvoicePaymentHistory/request-approval`, data);
};

export const apiApproveTransaction = (data: IDebtTransactionApprove) => {
    return request('post', `/InvoicePaymentHistory/process-approval`, data);
};

export const apiValidateExportWarehouse = (params: any, configs?: RequestConfig) =>
    request(
        'post',
        '/DebtDocument/checknegativedeposit',
        {
            payload: params,
        },
        configs,
    );

export const apiSearchDebtPayablesSupplier = (params: ParamsGetList, configs?: RequestConfig) =>
    request('post', '/DebtPayable/search', params, configs);

export const apiSearchDebtPayablesBySupplierId = (params: ParamsGetList, configs?: RequestConfig) =>
    request('post', '/DebtPayable/supplier/search', params, configs);
