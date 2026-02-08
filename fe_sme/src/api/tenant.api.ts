import { ENV_CONFIG } from '@/constants';

import { ITenantList } from '@/interface/system';
import { ITenant } from '@/interface/tenant';

import { RequestConfig, request } from './request';

export const apiGetTenants = (config?: RequestConfig) => request<ITenant[]>('get', `${ENV_CONFIG.API}/Account/tenants`, null, config);
export const apiGetAllTenants = (config?: RequestConfig) => request<ITenantList[]>('get', `/tenant`, null, { loading: false });
export const apiGetDetailTenant = (id: string, config?: RequestConfig) => request<ITenantList>('get', `/tenant/${id}`, null, config);
export const apiUpdateTenant = (data: ITenantList, config?: RequestConfig) => request<ITenantList>('put', `/tenant`, { payload: data }, config);
