import { IAddEditEmployee } from '@/interface/employee';

import { ParamsGetList, RequestConfig, request } from './request';


// PayrollCycle
export const apiSearchPayrollCycle = (params: ParamsGetList, configs?: RequestConfig) => request('post', 'PayrollCycle/search', params, configs);
export const apiAddPayrollCycle = (data: IAddEditEmployee) => request('post', '/PayrollCycle', { payload: data });
export const apiUpdatePayrollCycle = (data: IAddEditEmployee) => request('put', '/PayrollCycle', { payload: data });
export const apiGetPayrollCycleById = (id: string, configs?: RequestConfig) => request('get', `/PayrollCycle/${id}`, undefined, configs);
export const apiDeletePayrollCycle = (id: string) => request('delete', `/PayrollCycle/${id}`);

// PayrollDetail
export const apiGetPayrollDetailById = (id: string, configs?: RequestConfig) => request('get', `/PayrollDetail/${id}`, undefined, configs);

// PayrollHistory
export const apiGetPayrollHistoryById = (id: string, configs?: RequestConfig) => request('get', `/PayrollHistory/${id}`, undefined, configs);

// PayrollTax
export const apiSearchPayrollTax = (params: ParamsGetList, configs?: RequestConfig) => request('post', 'PayrollTax/search', params, configs);
export const apiAddPayrollTax = (data: IAddEditEmployee) => request('post', '/PayrollTax', { payload: data });
export const apiUpdatePayrollTax = (data: IAddEditEmployee) => request('put', '/PayrollTax', { payload: data });
export const apiGetPayrollTaxById = (id: string, configs?: RequestConfig) => request('get', `/PayrollTax/${id}`, undefined, configs);
export const apiDeletePayrollTax = (id: string) => request('delete', `/PayrollTax/${id}`);