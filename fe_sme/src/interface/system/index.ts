export interface IAddEditRoleGroup {
    id?: string;
    code?: string;
    name?: string;
    description?: string;
}

export interface IUpdatePermissionRoleGroup {
    groupId?: string;
    permissions?: {
        key: string;
        name: string;
        permission: string;
    }[];
}

export interface IRoleGroup {
    permissions: string[];
    id: string;
    roleName: string;
    code: string;
    isDeleted: boolean;
    createdBy: string | null;
    created: string;
    lastModifiedBy: string | null;
    lastModified: string;
}

export interface IRoleGroupListResponse {
    pageNumber: number;
    pageSize: number;
    totalItems: number;
    succeeded: boolean;
    message: string | null;
    errorCode: string | null;
    errors: string[] | null;
    data: IRoleGroup[];
}

export interface ITenantList {
    id: string;
    code: string;
    name: string;
    shortName: string | null;
    taxCode: string | null;
    email: string | null;
    phoneNumber: string | null;
    address: string | null;
    contactPersonName: string | null;
    contactPersonPhone: string | null;
    bankName: string | null;
    bankBranch: string | null;
    bankAccountName: string | null;
    bankAccountNumber: string | null;
}
