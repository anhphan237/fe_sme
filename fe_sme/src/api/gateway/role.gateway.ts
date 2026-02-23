import { GATEWAY_OPERATIONS } from '@/constants/gateway-operations';

import { type RequestConfig, gatewayRequest } from '../request';

/**
 * Assign role to user
 * @param userId - User ID
 * @param roleId - Role ID
 * @param config - Optional request config
 */
export const gatewayAssignRole = (userId: string, roleId: string, config?: RequestConfig) =>
    gatewayRequest<{ userId: string; roleId: string }, void>(GATEWAY_OPERATIONS.ROLE_ASSIGN, { userId, roleId }, config);

/**
 * Revoke role from user
 * @param userId - User ID
 * @param roleId - Role ID
 * @param config - Optional request config
 */
export const gatewayRevokeRole = (userId: string, roleId: string, config?: RequestConfig) =>
    gatewayRequest<{ userId: string; roleId: string }, void>(GATEWAY_OPERATIONS.ROLE_REVOKE, { userId, roleId }, config);
