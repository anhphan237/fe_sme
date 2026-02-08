import { QUOTATION_TARGET_STATUS } from '@/constants/sales/quotation';

export interface IDebtTransaction {
    id: string;
    debtDocumentId: string;
    status: QUOTATION_TARGET_STATUS;
    paymentDate: string;
    transactionType: number;
    paymentMethod: number;
    totalAmount: number;
    description: string;
    hasVAT: boolean;
    approver?: Approver;
    personInCharge: PersonInCharge;
    attachments: TransactionAttachments[];
}

export interface Approver {
    id: string;
    debtTransactionId: string;
    status: number;
    description: string;
    userId: string;
    userCode: string;
    userName: string;
    userPhone: string;
    userPosition: string;
}

export interface PersonInCharge {
    id: string;
    debtTransactionId: string;
    userId: string;
    userCode: string;
    userName: string;
    userPhone: string;
    userPosition: string;
}

export interface TransactionAttachments {
    id: string;
    debtTransactionId: string;
    name: string;
    description: string;
    extension: string;
    path: string;
    created: string;
    lastModified: any;
    status?: 'done' | 'uploading' | 'error';
}

export interface IDebtTransactionRequest {
    debtTransactionId: string;
    approverUserId: string;
    description: string;
}

export interface IDebtTransactionApprove {
    debtTransactionId: string;
    description: string;
    targetStatus: number;
}
