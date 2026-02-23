import { GATEWAY_OPERATIONS } from '@/constants/gateway-operations';

import type {
    Company,
    CompanySetupRequest,
    CompanySetupResponse,
    CreateDepartmentRequest,
    Department,
    DepartmentListResponse,
} from '@/interface/gateway';

import { type RequestConfig, gatewayRequest } from '../request';

// ========== Company Operations ==========

/**
 * Setup new company (public operation - no auth required)
 * @param data - Company setup data
 * @param config - Optional request config
 */
export const gatewaySetupCompany = (data: CompanySetupRequest, config?: RequestConfig) =>
    gatewayRequest<CompanySetupRequest, CompanySetupResponse>(GATEWAY_OPERATIONS.COMPANY_SETUP, data, config);

/**
 * Register new company
 * @param data - Company registration data
 * @param config - Optional request config
 */
export const gatewayRegisterCompany = (data: Partial<Company>, config?: RequestConfig) =>
    gatewayRequest<Partial<Company>, Company>(GATEWAY_OPERATIONS.COMPANY_REGISTER, data, config);

/**
 * Create company
 * @param data - Company data
 * @param config - Optional request config
 */
export const gatewayCreateCompany = (data: Partial<Company>, config?: RequestConfig) =>
    gatewayRequest<Partial<Company>, Company>(GATEWAY_OPERATIONS.COMPANY_CREATE, data, config);

// ========== Department Operations ==========

/**
 * List departments
 * @param companyId - Company ID (optional, uses current user's company if not provided)
 * @param config - Optional request config
 */
export const gatewayListDepartments = (companyId?: string, config?: RequestConfig) =>
    gatewayRequest<{ companyId?: string }, DepartmentListResponse>(GATEWAY_OPERATIONS.DEPARTMENT_LIST, { companyId }, config);

/**
 * Create department
 * @param data - Department data
 * @param config - Optional request config
 */
export const gatewayCreateDepartment = (data: CreateDepartmentRequest, config?: RequestConfig) =>
    gatewayRequest<CreateDepartmentRequest, Department>(GATEWAY_OPERATIONS.DEPARTMENT_CREATE, data, config);

/**
 * Update department
 * @param departmentId - Department ID
 * @param data - Updated department data
 * @param config - Optional request config
 */
export const gatewayUpdateDepartment = (departmentId: string, data: Partial<CreateDepartmentRequest>, config?: RequestConfig) =>
    gatewayRequest<Partial<CreateDepartmentRequest> & { departmentId: string }, Department>(
        GATEWAY_OPERATIONS.DEPARTMENT_UPDATE,
        { ...data, departmentId },
        config,
    );
