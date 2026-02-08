import {
    IAddEditBusinessExpense,
    IAddEditCustomerType,
    IAddEditDeliveryMethod,
    IAddEditDepartment,
    IAddEditExpensesType,
    IAddEditOrderStatus,
    IAddEditPartnerType,
    IAddEditPaymentFund,
    IAddEditPaymentMethod,
    IAddEditPosition,
    IAddEditProductGroup,
    IAddEditProductType,
    IAddEditProductUnit,
    IAddEditSalesChannel,
    IAddEditSalesMethod,
    IAddEditShippingFee,
    IAddEditShippingMethod,
    IAddEditWarehouse,
    IAddEditWarehouseArea,
    IPositionByDepartment,
} from '@/interface/category';

import { ParamsGetList, RequestConfig, request } from './request';

export const apiGetProducts = (params: ParamsGetList) => request('get', `/Product`, params);
export const apiSearchProducts = (params: ParamsGetList, configs?: RequestConfig) => request('post', `/Product/search`, params, configs);
export const apiGetProduct = (productId: string) => request('get', `/Product/${productId}`);
export const apiAddProduct = (data: any) =>
    request('post', `/Product`, {
        payload: data,
    });
export const apiUpdateProduct = (data: any) => request('put', `/Product`, { payload: data });
export const apiUpdateQuantityProduct = (data: any) => request('put', `/Product/quantity-in-stock`, { payload: data });
export const apiDeleteProduct = (id: string) => request('delete', `/Product/${id}`);

export const apiSearchProductsGroup = (params: ParamsGetList, configs?: RequestConfig) => request('post', '/ProductGroup/search', params, configs);
export const apiAddProductGroup = (data: IAddEditProductGroup) =>
    request('post', '/ProductGroup', {
        payload: data,
    });
export const apiUpdateProductGroup = (data: IAddEditProductGroup) => request('put', '/ProductGroup', { payload: data });
export const apiDeleteProductGroup = (id: string) => request('delete', `/ProductGroup/${id}`);

export const apiSearchProductType = (params: ParamsGetList, config?: RequestConfig) => request('post', '/ProductType/search', params, config);
export const apiAddProductType = (data: IAddEditProductType) =>
    request('post', '/ProductType', {
        payload: data,
    });
export const apiUpdateProductType = (data: IAddEditProductType) => request('put', '/ProductType', { payload: data });
export const apiDeleteProductType = (id: string) => request('delete', `/ProductType/${id}`);

export const apiSearchSalesChannel = (params: ParamsGetList) => request('post', '/SalesChannel/search', params);
export const apiAddSalesChannel = (data: IAddEditSalesChannel) =>
    request('post', '/SalesChannel', {
        payload: data,
    });
export const apiUpdateSalesChannel = (data: IAddEditSalesChannel) => request('put', '/SalesChannel', { payload: data });
export const apiDeleteSalesChannel = (id: string) => request('delete', `/SalesChannel/${id}`);

export const apiSearchSalesMethod = (params: ParamsGetList) => request('post', '/SalesMethod/search', params);
export const apiAddSalesMethod = (data: IAddEditSalesMethod) =>
    request('post', '/SalesMethod', {
        payload: data,
    });
export const apiUpdateSalesMethod = (data: IAddEditSalesMethod) => request('put', '/SalesMethod', { payload: data });
export const apiDeleteSalesMethod = (id: string) => request('delete', `/SalesMethod/${id}`);

export const apiSearchShippingMethod = (params: ParamsGetList) => request('post', '/ShippingMethod/search', params);
export const apiAddShippingMethod = (data: IAddEditShippingMethod) =>
    request('post', '/ShippingMethod', {
        payload: data,
    });
export const apiUpdateShippingMethod = (data: IAddEditShippingMethod) => request('put', '/ShippingMethod', { payload: data });
export const apiDeleteShippingMethod = (id: string) => request('delete', `/ShippingMethod/${id}`);

export const apiSearchShippingFee = (params: ParamsGetList) => request('post', '/ShippingFee/search', params);
export const apiAddShippingFee = (data: IAddEditShippingFee) =>
    request('post', '/ShippingFee', {
        payload: data,
    });
export const apiUpdateShippingFee = (data: IAddEditShippingFee) => request('put', '/ShippingFee', { payload: data });
export const apiDeleteShippingFee = (id: string) => request('delete', `/ShippingFee/${id}`);

export const apiSearchPaymentMethod = (params: ParamsGetList, configs?: RequestConfig) => request('post', '/PaymentMethod/search', params, configs);
export const apiAddPaymentMethod = (data: IAddEditPaymentMethod) =>
    request('post', '/PaymentMethod', {
        payload: data,
    });
export const apiUpdatePaymentMethod = (data: IAddEditPaymentMethod) => request('put', '/PaymentMethod', { payload: data });
export const apiDeletePaymentMethod = (id: string) => request('delete', `/PaymentMethod/${id}`);

export const apiSearchCustomerType = (params: ParamsGetList, configs?: RequestConfig) => request('post', '/CustomerType/search', params, configs);
export const apiAddCustomerType = (data: IAddEditCustomerType) =>
    request('post', '/CustomerType', {
        payload: data,
    });
export const apiUpdateCustomerType = (data: IAddEditCustomerType) => request('put', '/CustomerType', { payload: data });
export const apiDeleteCustomerType = (id: string) => request('delete', `/CustomerType/${id}`);

export const apiSearchSupplierType = (params: ParamsGetList, configs?: RequestConfig) => request('post', '/SupplierType/search', params, configs);
export const apiAddSupplierType = (data: any) =>
    request('post', '/SupplierType', {
        payload: data,
    });
export const apiUpdateSupplierType = (data: any) => request('put', '/SupplierType', { payload: data });
export const apiDeleteSupplierType = (id: string) => request('delete', `/SupplierType/${id}`);

export const apiSearchPartnerType = (params: ParamsGetList, configs?: RequestConfig) => request('post', '/SupplierType/search', params, configs);
export const apiAddPartnerType = (data: IAddEditPartnerType) =>
    request('post', '/SupplierType', {
        payload: data,
    });
export const apiUpdatePartnerType = (data: IAddEditPartnerType) => request('put', '/SupplierType', { payload: data });
export const apiDeletePartnerType = (id: string) => request('delete', `/SupplierType/${id}`);

export const apiSearchDeliveryMethod = (params: ParamsGetList) => request('post', '/DeliveryMethod/search', params);
export const apiAddDeliveryMethod = (data: IAddEditDeliveryMethod) =>
    request('post', '/DeliveryMethod', {
        payload: data,
    });
export const apiUpdateDeliveryMethod = (data: IAddEditDeliveryMethod) => request('put', '/DeliveryMethod', { payload: data });
export const apiDeleteDeliveryMethod = (id: string) => request('delete', `/DeliveryMethod/${id}`);

export const apiSearchPosition = (params: ParamsGetList, configs?: RequestConfig) => request('post', '/Position/search', params, configs);
export const apiSearchPositionByDepartments = (params: ParamsGetList & { departmentId?: string[] }, configs?: RequestConfig) =>
    request<IPositionByDepartment[]>('post', '/Position/departments', params, configs);

export const apiAddPosition = (data: IAddEditPosition) =>
    request('post', '/Position', {
        payload: data,
    });
export const apiUpdatePosition = (data: IAddEditPosition) => request('put', '/Position', { payload: data });
export const apiDeletePosition = (id: string) => request('delete', `/Position/${id}`);

export const apiSearchDepartment = (params: ParamsGetList, configs?: RequestConfig) => request('post', '/Department/search', params, configs);
export const apiAddDepartment = (data: IAddEditDepartment) =>
    request('post', '/Department', {
        payload: data,
    });
export const apiUpdateDepartment = (data: IAddEditDepartment) => request('put', '/Department', { payload: data });
export const apiDeleteDepartment = (id: string) => request('delete', `/Department/${id}`);

export const apiSearchWarehouse = (params: ParamsGetList, configs?: RequestConfig) => request('post', '/Warehouse/search', params, configs);
export const apiSearchDetailWarehouse = (id: string) => request('get', `/Warehouse/${id}`);
export const apiAddWarehouse = (data: IAddEditWarehouse) =>
    request('post', '/Warehouse', {
        payload: data,
    });
export const apiUpdateWarehouse = (data: IAddEditWarehouse) => request('put', '/Warehouse', { payload: data });
export const apiDeleteWarehouse = (id: string) => request('delete', `/Warehouse/${id}`);

export const apiSearchWarehouseArea = (params: ParamsGetList, configs?: RequestConfig) => request('post', '/WarehouseType/search', params, configs);
export const apiAddWarehouseArea = (data: IAddEditWarehouseArea) =>
    request('post', '/WarehouseType', {
        payload: data,
    });
export const apiUpdateWarehouseArea = (data: IAddEditWarehouseArea) => request('put', '/WarehouseType', { payload: data });
export const apiDeleteWarehouseArea = (id: string) => request('delete', `/WarehouseType/${id}`);

export const apiSearchBusinessExpense = (params: ParamsGetList, configs?: RequestConfig) => request('post', '/ExpensesType/search', params, configs);
export const apiAddBusinessExpense = (data: IAddEditBusinessExpense) =>
    request('post', '/ExpensesType', {
        payload: data,
    });
export const apiUpdateBusinessExpense = (data: IAddEditBusinessExpense) => request('put', '/ExpensesType', { payload: data });
export const apiDeleteBusinessExpense = (id: string) => request('delete', `/ExpensesType/${id}`);

export const apiGetProductHistory = (params: ParamsGetList & { productId: string }, configs?: RequestConfig) =>
    request('post', '/Product/history', params, configs);

export const apiSearchProductUnit = (params: ParamsGetList, configs?: RequestConfig) => request('post', '/ProductUnit/search', params, configs);
export const apiAddProductUnit = (data: IAddEditProductUnit) =>
    request('post', '/ProductUnit', {
        payload: data,
    });
export const apiUpdateProductUnit = (data: IAddEditProductUnit) => request('put', '/ProductUnit', { payload: data });
export const apiDeleteProductUnit = (id: string) => request('delete', `/ProductUnit/${id}`);

export const apiSearchOrderStatus = (params: ParamsGetList, configs?: RequestConfig) => request('post', '/DeliveryStatus/search', params, configs);
export const apiAddOrderStatus = (data: IAddEditOrderStatus) =>
    request('post', '/DeliveryStatus', {
        payload: data,
    });
export const apiUpdateOrderStatus = (data: IAddEditOrderStatus) => request('put', '/DeliveryStatus', { payload: data });
export const apiDeleteOrderStatus = (id: string) => request('delete', `/DeliveryStatus/${id}`);

// Payment Fund APIs
export const apiSearchPaymentFund = (params: ParamsGetList, configs?: RequestConfig) => request('post', '/PaymentFund/search', params, configs);

export const apiAddPaymentFund = (data: IAddEditPaymentFund) =>
    request('post', '/PaymentFund', {
        payload: data,
    });

export const apiUpdatePaymentFund = (data: IAddEditPaymentFund) => request('put', '/PaymentFund', { payload: data });

export const apiDeletePaymentFund = (id: string) => request('delete', `/PaymentFund/${id}`);

// Expenses Type APIs
export const apiSearchExpensesType = (params: ParamsGetList, configs?: RequestConfig) => request('post', '/ExpensesType/search', params, configs);

export const apiAddExpensesType = (data: IAddEditExpensesType) =>
    request('post', '/ExpensesType', {
        payload: data,
    });

export const apiUpdateExpensesType = (data: IAddEditExpensesType) => request('put', '/ExpensesType', { payload: data });

export const apiDeleteExpensesType = (id: string) => request('delete', `/ExpensesType/${id}`);
