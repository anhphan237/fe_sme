export interface IDebtTransaction {
    id: string;
    debtDocumentId: string;
    status: number;
    transactionDate: string;
    transactionType: number;
    amount: number;
    description?: string;
    hasVAT: boolean;
    created: string;
    lastModified?: string;
    createdBy?: string;
    lastModifiedBy?: string;
    paymentMethodCode: string;
    paymentMethodName: string;
    createdByName?: string;
    personInCharge?: IDebtTransactionPersonInCharge;
    attachments?: IDebtTransactionAttachment[];
}

export interface IDebtTransactionRequest {
    id?: string;
    debtDocumentId: string;
    transactionDate: string;
    transactionType: number;
    amount: number;
    description?: string;
    paymentMethodCode: string;

    personInCharge?: IDebtTransactionPersonInChargeRequest;
    attachments?: IDebtTransactionAttachmentRequest[];
}

export interface IDebtTransactionPersonInCharge {
    id: string;
    debtTransactionId: string;
    userId: string;
    userCode: string;
    userName: string;
    userPhone: string;
    userPosition: string;
}

export interface IDebtTransactionPersonInChargeRequest {
    userId: string;
    userCode?: string;
    userName?: string;
    userPhone?: string;
    userPosition?: string;
}

export interface IDebtTransactionAttachment {
    id: string;
    debtTransactionId: string;
    name: string;
    description?: string;
    extension: string;
    path: string;
    created: string;
    lastModified?: string;
    status?: 'done' | 'uploading' | 'error' | 'removed';
}

export interface IDebtTransactionAttachmentRequest {
    name: string;
    description?: string;
    extension: string;
    path: string;
}
