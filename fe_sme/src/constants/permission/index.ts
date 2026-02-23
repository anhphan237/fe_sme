import { AppRouters } from '../router';

/**
 * phòng ban a
 * chức vụ 1
 * chức năng 2
 * full quyền f
 * ==> a.1.2.f
 * z.0... => is supper admin
 */
export const PERMISSIONS = {
    VIEW: 'v',
    CREATE: 'c',
    UPDATE: 'u',
    DELETE: 'd',
    FULL: 'f',
} as const;
export type PERMISSIONS = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export enum DefaultRoles {
    SUPER_ADMIN = 'R001',
    ADMIN = 'R002',
    ACCOUNTANT = 'R003',
    USER = 'R004',
    ALL = 'all',
}

export enum DefaultTenantCode {
    LTBMA = 'CT001',
    QCLD = 'CT002',
    TDP = 'CT003',
    SUPER_ADMIN = 'MT000',
}

export const DefaultMappingPermission = {
    // SYSTEM
    [AppRouters.SYSTEM]: 'all',
    [AppRouters.USERS]: 'all',
    [AppRouters.TENANT]: 'all',
    [AppRouters.ROLE_GROUP]: 'all',
    [AppRouters.EDIT_ROLE_GROUP]: 'all',

    // DASHBOARD
    [AppRouters.DASHBOARDS]: 'all',

    // PROFILE
    [AppRouters.PROFILE]: 'all',

    // EMPLOYEES
    [AppRouters.EMPLOYEES]: 'all',
    [AppRouters.EMPLOYEE_ADD]: 'all',
    [AppRouters.EMPLOYEE_DETAIL]: 'all',

    // EMPLOYMENT CONTRACTS
    [AppRouters.CONTRACT]: 'all',
    [AppRouters.ADD_CONTRACT]: 'all',
    [AppRouters.EDIT_CONTRACT]: 'all',
    [AppRouters.DETAIL_CONTRACT]: 'all',

    // CATEGORIES
    [AppRouters.CATEGORIES]: 'all',
    [AppRouters.DEPARTMENT]: 'all',
    [AppRouters.DEPARTMENT_ADD]: 'all',
    [AppRouters.DEPARTMENT_EDIT]: 'all',
    [AppRouters.POSITION]: 'all',
    [AppRouters.POSITION_ADD]: 'all',
    [AppRouters.POSITION_EDIT]: 'all',

    // ONBOARDING (to be implemented)
    [AppRouters.ONBOARDING]: 'all',
    [AppRouters.ONBOARDING_TEMPLATES]: 'all',
    [AppRouters.ONBOARDING_TEMPLATE_ADD]: 'all',
    [AppRouters.ONBOARDING_TEMPLATE_EDIT]: 'all',
    [AppRouters.ONBOARDING_TEMPLATE_DETAIL]: 'all',
    [AppRouters.ONBOARDING_INSTANCES]: 'all',
    [AppRouters.ONBOARDING_INSTANCE_ADD]: 'all',
    [AppRouters.ONBOARDING_INSTANCE_DETAIL]: 'all',
    [AppRouters.ONBOARDING_TASKS]: 'all',
    [AppRouters.ONBOARDING_MY_TASKS]: 'all',

    // SURVEYS (to be implemented)
    [AppRouters.SURVEYS]: 'all',
    [AppRouters.SURVEY_TEMPLATES]: 'all',
    [AppRouters.SURVEY_TEMPLATE_ADD]: 'all',
    [AppRouters.SURVEY_TEMPLATE_EDIT]: 'all',
    [AppRouters.SURVEY_TEMPLATE_DETAIL]: 'all',
    [AppRouters.SURVEY_RESPONSES]: 'all',
    [AppRouters.SURVEY_TAKE]: 'all',

    // DOCUMENTS (to be implemented)
    [AppRouters.DOCUMENTS]: 'all',
    [AppRouters.DOCUMENT_UPLOAD]: 'all',
    [AppRouters.DOCUMENT_DETAIL]: 'all',

    // ANALYTICS (to be implemented)
    [AppRouters.ANALYTICS]: 'all',
    [AppRouters.ANALYTICS_ONBOARDING]: 'all',
};
