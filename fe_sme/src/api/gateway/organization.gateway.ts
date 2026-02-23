import { GATEWAY_OPERATIONS } from '@/constants/gateway-operations';

import type { BillingPlan, BillingPlanListResponse, CompanySetupRequest, CompanySetupResponse, CreateSubscriptionRequest } from '@/interface/gateway';
import type { OrgSetupParams } from '@/interface/organization';

import { type RequestConfig, gatewayRequest } from '../request';

/**
 * Lưu thông tin thiết lập tổ chức (bước 2 onboarding).
 * Map từ OrgSetupParams (form data) sang CompanySetupRequest (gateway DTO).
 */
export const gatewayOrgSetup = (params: OrgSetupParams, config?: RequestConfig) => {
    const payload: Partial<CompanySetupRequest> = {
        companyName: params.companyName,
        industry: params.industry,
        size: params.companySize,
    };
    return gatewayRequest<Partial<CompanySetupRequest>, CompanySetupResponse>(GATEWAY_OPERATIONS.COMPANY_SETUP, payload, config);
};

/**
 * Lấy danh sách các gói dịch vụ.
 */
export const gatewayListPlans = (config?: RequestConfig) =>
    gatewayRequest<void, BillingPlanListResponse>(GATEWAY_OPERATIONS.BILLING_PLAN_LIST, undefined, config);

/**
 * Chọn gói dịch vụ cho tổ chức (bước 3 onboarding).
 */
export const gatewaySelectPlan = (planId: string, config?: RequestConfig) =>
    gatewayRequest<CreateSubscriptionRequest, void>(GATEWAY_OPERATIONS.BILLING_SUBSCRIPTION_CREATE, { planId }, config);
