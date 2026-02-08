import { QUOTATION_CALCULATION_TYPE, QUOTATION_TARGET_STATUS } from '@/constants/sales/quotation';

import { FormQuotation, SellingPriceCalculator } from '@/interface/sales';

import { RequestConfig, request } from './request';

export const apiCreateQuotation = (data: { payload: Partial<FormQuotation> }, config?: RequestConfig) =>
    request('post', '/Quotation', data, { ...config, loading: false });
export const apiUpdateQuotation = (data: { payload: Partial<FormQuotation> }, config?: RequestConfig) =>
    request('put', '/Quotation', data, { ...config, loading: false });
export const apiDeleteQuotation = (id: string, config?: RequestConfig) => request('delete', `/Quotation/${id}`, {}, { ...config, loading: false });
export const apiGetDetailQuotation = (id: string, config?: RequestConfig) => request('get', `/Quotation/${id}`, {}, { ...config, loading: false });

export interface QuotationListFilterParams {
    pageSize: number;
    pageNumber: number;
    search?: string;
}
export const apiGetListQuotation = (params: QuotationListFilterParams, config?: RequestConfig) => {
    const { search, ...rest } = params;
    const body = { ...rest, searchValue: search };
    return request('post', '/Quotation/search', body, { ...config, loading: false });
};

export interface ProductSellingPriceBody {
    products: { productId: string; quantity: number }[];
}
export const apiCalculateProductSellingPrice = (data: ProductSellingPriceBody, config?: RequestConfig) =>
    request('post', '/Calculator/sellingPrice', data, { ...config, loading: false }) as unknown as Promise<SellingPriceCalculator>;

export const apiCalculatePriceConverter = (
    data: {
        productId: string;
        sellingPrice: number;
        quantity?: number;
        calculateBy: QUOTATION_CALCULATION_TYPE;
        weightActual?: number;
        weightTheoretical?: number;
    },
    config?: RequestConfig,
) => request('post', '/Calculator/convert', data, { ...config, loading: false });

export const apiCheckInventory = (productIds: string[], config?: RequestConfig) => request('post', '/Inventory/check', { productIds }, config);

export interface QuotationStatusUpdateBody {
    quotationIssueId: string;
    targetStatus: QUOTATION_TARGET_STATUS;
    description?: string;
}
export const apiUpdateQuotationStatus = (body: QuotationStatusUpdateBody) => {
    return request('post', '/Quotation/process-approval', body, { loading: false });
};

export interface QuotationRequestApprovalBody {
    quotationIssueId: string;
    approverUserId: string;
    description?: string;
}

export const apiRequestQuotationApproval = (body: QuotationRequestApprovalBody, config?: RequestConfig) => {
    return request('post', `/Quotation/request-approval`, body, { ...config, loading: false });
};
export const apiCancelQuotation = (id: string, config?: RequestConfig) =>
    request('post', `/Quotation/cancel/${id}`, {}, { ...config, loading: false });
