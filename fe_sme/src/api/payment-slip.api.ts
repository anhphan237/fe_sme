import { PaymentSlipRequest } from '@/interface/payment-slip';

import { ParamsGetList, RequestConfig, request } from './request';

export const apiSearchPaymentSlip = (params: ParamsGetList, configs?: RequestConfig) => request('post', '/PaymentSlip/search', params, configs);

export const apiGetPaymentSlipById = (id: string, configs?: RequestConfig) => request('get', `/PaymentSlip/${id}`, undefined, configs);

export const apiCreatePaymentSlip = (data: PaymentSlipRequest) =>
    request('post', '/PaymentSlip', {
        payload: data,
    });

export const apiUpdatePaymentSlip = (data: PaymentSlipRequest) => request('put', '/PaymentSlip', { payload: data });
export const apiDeletePaymentSlip = (id: string) => request('delete', `/PaymentSlip/${id}`);
