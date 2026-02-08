export interface PaymentSlipRequester {
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

export interface PaymentSlipDetail {
    id?: string;
    paymentSlipId: string;
    paymentSlipName?: string;
    paymentDate: string;
    businessPurpose?: string;
    cost: number;
    number: number;
    totalAmount: number;
    note?: string;
    created: string;
    lastModified?: string;
}

export interface PaymentSlipAttachment {
    id: string;
    paymentSlipId: string;
    name?: string;
    description?: string;
    extension?: string;
    path?: string;
    created: string;
    lastModified?: string;
}

export interface PaymentSlipType {
    id: string;
    ticketNumber: string;
    documentDate: string;
    status: PaymentSlipStatus;
    note?: string;
    ticketType: string;
    paymentMethod: string;
    totalAmount: number;
    requester: PaymentSlipRequester;
    details?: PaymentSlipDetail[];
    attachments?: PaymentSlipAttachment[];
    created: string;
    createdBy?: string;
    createdByName?: string;
    lastModified?: string;
    lastModifiedBy?: string;
    lastModifiedByName?: string;
}

export enum PaymentSlipStatus {
    UnPaid = 0, // Đang xử lí
    Paid = 1, // Đã chi
}

export interface PaymentSlipRequest {
    id?: string;
    documentDate: string;
    status?: PaymentSlipStatus;
    note?: string;
    ticketType: string;
    ticketTypeName?: string;
    paymentMethod: string;
    paymentMethodName?: string;
    requester: Partial<PaymentSlipRequester>;
    details: PaymentSlipDetail[];
    attachments?: PaymentSlipAttachment[];
}

export interface PaymentSlipResponse {
    data: PaymentSlipType[];
    totalItems: number;
    totalMoney?: number;
    pageNumber: number;
    pageSize: number;
    succeeded: boolean;
    message?: string;
}
