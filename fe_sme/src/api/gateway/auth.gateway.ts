import { GATEWAY_OPERATIONS } from '@/constants/gateway-operations';

import type { CheckEmailRequest, CheckEmailResponse, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '@/interface/gateway';

import { type RequestConfig, gatewayRequest } from '../request';

/**
 * User Login
 */
export const gatewayLogin = (email: string, password: string, config?: RequestConfig) =>
    gatewayRequest<LoginRequest, LoginResponse>(GATEWAY_OPERATIONS.AUTH_LOGIN, { email, password }, config);

/**
 * HR Owner Registration – tạo tài khoản + tenant mới.
 * Response trả về accessToken + onboardingStep = 'org_setup'.
 */
export const gatewayRegister = (payload: RegisterRequest, config?: RequestConfig) =>
    gatewayRequest<RegisterRequest, RegisterResponse>(GATEWAY_OPERATIONS.AUTH_REGISTER, payload, config);

/**
 * Check if email exists in the system
 */
export const gatewayCheckEmail = (email: string, config?: RequestConfig) =>
    gatewayRequest<CheckEmailRequest, CheckEmailResponse>(GATEWAY_OPERATIONS.AUTH_CHECK_EMAIL, { email }, config);
