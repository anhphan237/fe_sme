import { IAddEditPurchaseContract } from '@/interface/contract';

import { ParamsGetList, RequestConfig, request } from './request';

export const apiSearchPurchaseContract = (params: ParamsGetList, configs?: RequestConfig) =>
    request('post', '/ContractPurchase/search', params, configs);
export const apiSearchPurchaseContractFromReceipt = (params: ParamsGetList, configs?: RequestConfig) =>
    request('post', '/ContractPurchase/goodsReceipt', params, configs);

export const apiGetContracts = (params: ParamsGetList, configs?: RequestConfig) =>
    request('post', '/Contract/search', params, { loading: false, ...configs });

export const apiGetDetailPurchaseContract = (id: string) => request('get', `/Purchase/${id}`);
export const apiAddPurchaseContract = (data: IAddEditPurchaseContract) =>
    request('post', '/ContractPurchase', {
        payload: data,
    });
export const apiUpdatePurchaseContract = (data: IAddEditPurchaseContract) => request('put', '/ContractPurchase', { payload: data });
export const apiDeletePurchaseContract = (id: string) => request('delete', `/ContractPurchase/${id}`);

export const apiSearchInvoice = (params: ParamsGetList, configs?: RequestConfig) => request('post', '/Invoice/search', params, configs);
export const apiSearchInvoiceFromIssue = (params: ParamsGetList, configs?: RequestConfig) => request('post', '/Invoice/goodsIssue', params, configs);
export const apiGetDetailInvoice = (id: string, configs?: RequestConfig) => request('get', `/Invoice/${id}`, undefined, configs);
export const apiAddInvoice = (data: IAddEditPurchaseContract) =>
    request('post', '/Invoice', {
        payload: data,
    });
export const apiUpdateInvoice = (data: IAddEditPurchaseContract) => request('put', '/Invoice', { payload: data });
export const apiDeleteInvoice = (id: string) => request('delete', `/Invoice/${id}`);

export const apiSearchOrderRefund = (params: ParamsGetList, configs?: RequestConfig) => request('post', '/OrderReturn/search', params, configs);
export const apiGetDetailOrderRefund = (id: string) => request('get', `/OrderReturn/${id}`);
export const apiAddOrderRefund = (data: IAddEditPurchaseContract) =>
    request('post', '/OrderReturn', {
        payload: data,
    });
export const apiUpdateOrderRefund = (data: IAddEditPurchaseContract) => request('put', '/OrderReturn', { payload: data });
export const apiDeleteOrderRefund = (id: string) => request('delete', `/OrderReturn/${id}`);

export interface IRequestApproveContractBody {
    contractId: string;
    approverUserId: string;
    description?: string;
}
export const apiRequestApprovePurchaseContract = (data: IRequestApproveContractBody) => {
    return request('post', `/ContractPurchase/request-approval`, data);
};

export const apiRequestApproveSaleContract = (data: IRequestApproveContractBody) => {
    return request('post', `/Invoice/request-approval`, data);
};

export interface IApproveBody {
    contractId: string;
    description?: string;
    targetStatus: number;
}
export const apiApprovePurchaseContract = (data: IApproveBody) => {
    return request('post', `/ContractPurchase/process-approval`, data);
};

export const apiApproveSaleContract = (data: IApproveBody) => {
    return request('post', `/Invoice/process-approval`, data);
};

export const apiGetDetailSalesContract = (id: string) => request('get', `/Invoice/${id}/goodsIssue`);

export const apiSearchPurchaseContractFromGoodSearch = (params: ParamsGetList, configs?: RequestConfig) =>
    request('post', '/GoodsReceipt/purchase-order/search', params, configs);

export const apiSearchSalesContractFromIssue = (params: ParamsGetList, configs?: RequestConfig) =>
    request('post', '/GoodsIssue/sale-order/search', params, configs);
