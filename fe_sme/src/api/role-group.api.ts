import { IAddEditRoleGroup, IUpdatePermissionRoleGroup } from '@/interface/system';

import { ParamsGetList, RequestConfig, request } from './request';

/** @deprecated this api can be not worked, u should use `apiGetRoleGroup` instead */
export const apiSearchRoleGroup = (params: ParamsGetList, configs?: RequestConfig) => request('post', '/Group/search', params, configs);

export const apiGetRoleGroup = (params: Omit<ParamsGetList, 'search'>, configs?: RequestConfig) => request('get', '/Group', params, configs);

/** @deprecated this api can be not worked, u should use `apiCreateRoleGroup` instead */
export const apiAddRoleGroup = (data: IAddEditRoleGroup) =>
    request('post', '/Group', {
        payload: data,
    });

export const apiCreateRoleGroup = (data: Pick<IAddEditRoleGroup, 'name'>, configs?: RequestConfig) =>
    request(
        'post',
        '/Group',
        {
            payload: data,
        },
        configs,
    );

export const apiGetRoleGroupById = (id: string, configs?: RequestConfig) => request('get', `/Group/${id}`, configs);

export const apiUpdateRoleGroup = (data: IAddEditRoleGroup) => request('put', '/Group', { payload: data });

export const apiDeleteRoleGroup = (id: string) => request('delete', `/Group/${id}`);

export const apiCloneRoleGroup = (data: IAddEditRoleGroup) =>
    request('post', '/Group/clone', {
        payload: data,
    });

export const apiUpdatePermissionRoleGroup = (data: IUpdatePermissionRoleGroup) =>
    request('post', '/Group/permissions', {
        payload: data,
    });
