import { IAddEditWarehouse, IAddEditWarehouseConfig } from '@/interface/logistics';

import { ParamsGetList, RequestConfig, request } from './request';

export const apiSearchEnterWarehouse = (params: ParamsGetList, configs?: RequestConfig) => request('post', '/GoodsReceipt/search', params, configs);
export const apiGetDetailEnterWarehouse = (id: string) => request('get', `/GoodsReceipt/${id}`);
export const apiAddEnterWarehouse = (data: IAddEditWarehouse) =>
    request('post', '/GoodsReceipt', {
        payload: data,
    });
export const apiUpdateEnterWarehouse = (data: IAddEditWarehouse) => request('put', '/GoodsReceipt', { payload: data });
export const apiDeleteEnterWarehouse = (id: string) => request('delete', `/GoodsReceipt/${id}`);

export const apiSearchExportWarehouse = (params: ParamsGetList, configs?: RequestConfig) => request('post', '/GoodsIssue/search', params, configs);
export const apiGetDetailExportWarehouse = (id: string) => request('get', `/GoodsIssue/${id}`);
export const apiAddExportWarehouse = (data: IAddEditWarehouse) =>
    request('post', '/GoodsIssue', {
        payload: data,
    });
export const apiUpdateExportWarehouse = (data: IAddEditWarehouse) => request('put', '/GoodsIssue', { payload: data });
export const apiDeleteExportWarehouse = (id: string) => request('delete', `/GoodsIssue/${id}`);

export const apiSearchInventory = (params: ParamsGetList, configs?: RequestConfig) => request('post', '/Inventory/search', params, configs);
export const apiSearchInventoryIssue = (productId: string) => request('post', '/Inventory/goodsIssue', { productId });
export const apiSearchInventoryReceipt = (productId: string) => request('post', '/Inventory/goodsReceipt', { productId });

export const apiSearchWarehouseConfig = (params: ParamsGetList, configs?: RequestConfig) =>
    request('post', '/WarehouseSetting/search', params, configs);
export const apiGetDetailWarehouseConfig = (id: string) => request('get', `/WarehouseSetting/${id}`);
export const apiAddWarehouseConfig = (data: IAddEditWarehouseConfig) =>
    request('post', '/WarehouseSetting', {
        payload: data,
    });
export const apiUpdateWarehouseConfig = (data: IAddEditWarehouseConfig) => request('put', '/WarehouseSetting', { payload: data });
export const apiDeleteWarehouseConfig = (id: string) => request('delete', `/WarehouseSetting/${id}`);
