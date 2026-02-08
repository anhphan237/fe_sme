import { IAddEditAttendance, IAttendanceData, IAttendanceSummary, IAutoGenerateAttendance } from '@/interface/attendance/attendance';

import { ParamsGetList, RequestConfig, request } from './request';

export const apiSearchAttendances = (params: ParamsGetList, configs?: RequestConfig) => request('post', '/Attendance/search', params, configs);

export const apiGetAttendanceById = (id: string, configs?: RequestConfig) => request('get', `/Attendance/${id}`, undefined, configs);

export const apiGetAttendanceSummary = (employeeId: string, month: string, configs?: RequestConfig) =>
    request('get', `/Attendance/summary/${employeeId}?month=${month}`, undefined, configs);

export const apiCreateAttendance = (data: IAddEditAttendance) => request('post', '/Attendance', { payload: data });

export const apiUpdateAttendance = (id: string, data: IAddEditAttendance) => request('put', `/Attendance/${id}`, { payload: data });

export const apiDeleteAttendance = (id: string) => request('delete', `/Attendance/${id}`);

export const apiAutoGenerateAttendance = (data: IAutoGenerateAttendance) => request('post', '/Attendance/auto-generate', { payload: data });
