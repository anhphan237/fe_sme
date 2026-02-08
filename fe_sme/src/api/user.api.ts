import { ENV_CONFIG } from '@/constants';

import { IAddEditUser, LoginParams } from '@/interface/user';

import { RequestConfig, request } from './request';

export const apiLogin = (data: LoginParams, config?: RequestConfig) => request('post', `${ENV_CONFIG.API}/Account/authenticate`, data, config);
export const forgotPassword = (email: string) => request('post', `${ENV_CONFIG.API}/Account/forgotpassword`, { email });

export const apiLogout = () => request('post', `${ENV_CONFIG.API}/Account/logout`);

export const apiUserInfo = () => request('get', `/info`);

export const apiGetUsers = (pageIndex: string | number, pageSize: string | number) =>
    request('get', `/User/`, {
        pageNumber: pageIndex,
        pageSize: pageSize,
    });

export const apiGetProfile = () => request('get', `/User/profile`);

export const apiGetRole = () => request('get', `/User/roles`);

export const apiGetUser = (userId: string) => request('get', `/User/${userId}`);

export const apiAddUser = (data: IAddEditUser) =>
    request('post', `/User`, {
        payload: data,
    });

export const apiUpdateUser = (data: IAddEditUser) => request('put', `/User`, { payload: data });

export const apiDeleteUser = (id: string) => request('delete', `/User/${id}`);

export const apiChangePasswordUser = (oldPassword: string, newPassword: string) =>
    request('post', `/User/ChangePassword`, {
        oldPassword,
        newPassword,
    });

export const apiResetPasswordUser = (userId: string) =>
    request('post', `/User/ResetPassword`, {
        userId,
    });

export const apiSearchUsers = (pageIndex: string | number, pageSize: string | number, search?: string, config?: RequestConfig) =>
    request(
        'post',
        `/User/Search`,
        {
            PageNumber: pageIndex,
            PageSize: pageSize,
            search,
        },
        config,
    );
