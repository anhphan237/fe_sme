import type { OnboardingStep } from '@/interface/auth';
import type { Device, MenuChild } from '@/interface/layout';

export type Locale = 'vi_VN';

export interface ClientState {
    /** menu list for init tagsView */
    menuList: MenuChild[];

    /** login status */
    logged: boolean;

    /** bước hiện tại trong luồng onboarding — null nếu đã hoàn tất hoặc chưa đăng ký */
    onboardingStep: OnboardingStep | null;

    /** user's device */
    device: Device;

    /** menu collapsed status */
    collapsed: boolean;

    /** notification count */
    noticeCount: number;

    /** user's language */
    locale: Locale;
}

export interface LoginParams {
    ipAddress?: string;
    account: string;
    password: string;
    rememberMe: boolean;
    tenantId?: string;
}

export interface IAddEditUser {
    id?: string;
    username: string;
    email: string;
    fullname: string;
    phoneNumber: string;
    departmentIds: string[];
    positionIds: string[];
    tenantId?: string;
}

export interface UserProfileInfo {
    phoneNumberConfirmed: boolean;
    emailConfirmed: boolean;
    isLocked: boolean;
    roles: { code: string; name: string; displayName: string }[];
    id: string;
    username: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    created: string;
    lastModified: string;
    positions?: string[];
    code?: string;
    tenant?: {
        id: string;
        name: string;
        code: string;
    };
}

export interface IUserData {
    id: string;
    username: string;
    fullName: string;
    email: string;
    groupId: string;
    groupName: string;
    phoneNumber: string;
    created: string;
    lastModified: string;
    isAdmin: boolean;
    departments: { id: string; name: string }[];
    positions: { id: string; name: string }[];
    tenantId?: string;
}

export type IUserForm = {
    id?: string;
    username: string;
    email: string;
    name: string;
    phone: string;
    departmentIds: string[];
    positionIds: string[];
    departments?: { id: string; name: string }[];
    positions?: { id: string; name: string }[];
    groupId?: string;
    groupName?: string;
};

export class UserForm implements IUserForm {
    isAdmin: boolean = false;
    name: string = '';
    phone: string = '';
    id?: string | undefined = '';
    username: string = '';
    email: string = '';
    departmentIds: string[] = [];
    positionIds: string[] = [];
}

export interface UserRole {
    id: string;
    roleName: string;
}

export interface JWTDecode {
    sub: string;
    jti: string;
    email: string;
    uid: string;
    ip: string;
    roles: string[];
    permission: string[];
    exp: number;
    iss: string;
    aud: string;
}
