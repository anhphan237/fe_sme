import type { RequestConfig } from './request';
import { request } from './request';

export const apiGetDashboardSummary = (from: string, to: string, config?: RequestConfig) =>
    request(
        'post',
        `/Dashboard/summary`,
        {
            from,
            to,
            range: 'custom',
        },
        config,
    );

export const apiGetDashboardTopSelling = (from: string, to: string, config?: RequestConfig) =>
    request(
        'post',
        `/Dashboard/top-product`,
        {
            from,
            to,
            range: 'custom',
        },
        config,
    );

export const apiGetDashboardTopCustomer = (data: any, config?: RequestConfig) => request('post', `/Dashboard/top-customer`, data, config);

export const apiGetDashboardSummaryOrder = (from: string, to: string, config?: RequestConfig) =>
    request(
        'post',
        `/Dashboard/summary-order`,
        {
            from,
            to,
            range: 'custom',
        },
        config,
    );

export const apiGetDashboardMoneyTrend = (from: string, to: string, config?: RequestConfig) =>
    request(
        'post',
        `/Dashboard/summary-revenue`,
        {
            from,
            to,
            range: 'custom',
        },
        config,
    );

export const apiGetDashboardInTransit = (from: string, to: string, config?: RequestConfig) =>
    request(
        'post',
        `/Dashboard/in-transit`,
        {
            from,
            to,
            range: 'custom',
        },
        config,
    );

export const apiGetDashboardTopCustomerDebt = (data: any, config?: RequestConfig) => request('post', `/Dashboard/top-customer-debt`, data, config);
