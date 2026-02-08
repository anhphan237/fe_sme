import { IAddEditEmployee } from '@/interface/employee';

import { ParamsGetList, RequestConfig, request } from './request';

export const apiSearchEmployee = (params: ParamsGetList, configs?: RequestConfig) => request('post', 'Employee/search', params, configs);

export const apiAddEmployee = (data: IAddEditEmployee) => request('post', '/Employee', { payload: data });

export const apiUpdateEmployee = (data: IAddEditEmployee) => request('put', '/Employee', { payload: data });

export const apiGetEmployeeById = (id: string, configs?: RequestConfig) => request('get', `/Employee/${id}`, undefined, configs);

export const apiDeleteEmployee = (id: string) => request('delete', `/Employee/${id}`);
