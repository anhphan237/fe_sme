import { GATEWAY_OPERATIONS } from '@/constants/gateway-operations';

import type { CreateUserRequest, PaginatedRequest, UpdateUserRequest, User, UserListResponse } from '@/interface/gateway';

import { type RequestConfig, gatewayRequest } from '../request';

/**
 * List users with pagination
 * @param pageNumber - Page number (starts from 1)
 * @param pageSize - Number of items per page
 * @param search - Optional search term
 * @param config - Optional request config
 */
export const gatewayListUsers = (pageNumber: number, pageSize: number, search?: string, config?: RequestConfig) =>
    gatewayRequest<PaginatedRequest, UserListResponse>(GATEWAY_OPERATIONS.USER_LIST, { pageNumber, pageSize, search }, config);

/**
 * Get user by ID
 * @param userId - User ID
 * @param config - Optional request config
 */
export const gatewayGetUser = (userId: string, config?: RequestConfig) =>
    gatewayRequest<{ userId: string }, User>(GATEWAY_OPERATIONS.USER_GET, { userId }, config);

/**
 * Create new user
 * @param userData - User data
 * @param config - Optional request config
 */
export const gatewayCreateUser = (userData: CreateUserRequest, config?: RequestConfig) =>
    gatewayRequest<CreateUserRequest, User>(GATEWAY_OPERATIONS.USER_CREATE, userData, config);

/**
 * Update existing user
 * @param userId - User ID
 * @param userData - Updated user data
 * @param config - Optional request config
 */
export const gatewayUpdateUser = (userId: string, userData: Partial<UpdateUserRequest>, config?: RequestConfig) =>
    gatewayRequest<UpdateUserRequest, User>(GATEWAY_OPERATIONS.USER_UPDATE, { ...userData, userId }, config);

/**
 * Disable user account
 * @param userId - User ID
 * @param config - Optional request config
 */
export const gatewayDisableUser = (userId: string, config?: RequestConfig) =>
    gatewayRequest<{ userId: string }, void>(GATEWAY_OPERATIONS.USER_DISABLE, { userId }, config);
