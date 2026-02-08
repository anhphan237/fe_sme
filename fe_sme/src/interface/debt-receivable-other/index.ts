export interface DebtReceivableOtherRequester {
    id: string;
    userId: string;
    userCode?: string;
    userName?: string;
    userPhone?: string;
    userDepartment?: string;
    userPosition?: string;
    created: string;
    lastModified?: string;
}

export interface DebtReceivableOtherDetail {
    id?: string;
    debtReceivableOtherId: string;
    name?: string;
    paymentDate: string;
    businessPurpose?: string;
    cost: number;
    number: number;
    totalAmount: number;
    note?: string;
    created: string;
    lastModified?: string;
}

export interface DebtReceivableOtherAttachment {
    id: string;
    debtReceivableOtherId: string;
    name?: string;
    description?: string;
    extension?: string;
    path?: string;
    created: string;
    lastModified?: string;
}

export interface DebtReceivableOtherType {
    id: string;
    ticketNumber: string;
    documentDate: string;
    status: DebtReceivableOtherStatus;
    note?: string;
    ticketType: string;
    ticketTypeName?: string;
    paymentMethod: string;
    paymentMethodName?: string;
    totalAmount: number;
    requester: DebtReceivableOtherRequester;
    details?: DebtReceivableOtherDetail[];
    attachments?: DebtReceivableOtherAttachment[];
    created: string;
    createdBy?: string;
    createdByName?: string;
    lastModified?: string;
    lastModifiedBy?: string;
    lastModifiedByName?: string;
}

export enum DebtReceivableOtherStatus {
    UnPaid = 0, // Chưa thu
    Paid = 1, // Đã thu
}

export interface DebtReceivableOtherRequest {
    id?: string;
    documentDate: string;
    status?: DebtReceivableOtherStatus;
    note?: string;
    ticketType: string;
    ticketTypeName?: string;
    paymentMethod: string;
    paymentMethodName?: string;
    requester: Partial<DebtReceivableOtherRequester>;
    details: DebtReceivableOtherDetail[];
    attachments?: DebtReceivableOtherAttachment[];
}

export interface DebtReceivableOtherResponse {
    data: DebtReceivableOtherType[];
    totalItems: number;
    totalMoney?: number;
    pageNumber: number;
    pageSize: number;
    succeeded: boolean;
    message?: string;
}
