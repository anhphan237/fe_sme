import { COMMON_STATUS } from '@/core/components/Status/StatusTag';

export interface ICustomerPersonInCharge {
    userId: string;
    userName?: string;
    userPhone?: string;
    userEmail?: string;
    userPosition?: string;
}

export interface ICustomerContactPerson {
    name: string;
    phone: string;
    position?: string;
    description?: string;
    number?: number;
}

export interface ICustomerBankAccount {
    bankAccountName: string;
    bankAccountNumber: string;
    bankName: string;
    bankBranch?: string;
    description?: string;
    number?: number;
}

export interface IAddEditCustomerInfo {
    id?: string;
    customerTypeId: string;
    name: string;
    nameShort?: string;
    phone?: string;
    email?: string;
    address?: string;
    description?: string;
    taxCode?: string;
    customerPersonInCharge?: ICustomerPersonInCharge;
    customerContactPersons?: ICustomerContactPerson[];
    customerBankAccounts?: ICustomerBankAccount[];
    isSaveAdd?: boolean;
}

export interface IResHistoryOrder {
    quotationId: string;
    customerId: string;
    invoiceDate: string;
    invoice: string;
    approvalStatus: COMMON_STATUS;
    totalQuantity: number;
    totalAmount: number;
    channel: number;
}

export interface IResCustomerHistory {
    id: string;
    code: string;
    customerId: string;
    customerCode: string;
    customerName: string;
    customerPhone: string;
    created: string;
    totalQuantity: number;
    totalAmount: number;
    status: COMMON_STATUS;
    type: number;
    lastModified: string;
}

interface PersonInCharge {
    id: string;
    customerTrackingId: string;
    userId: string;
    userCode: string;
    userName: string;
    userPhone: string;
    userPosition: string;
}

export interface IHistoryInteraction {
    id: string;
    customerId: string;
    customer: { name: string; nameShort: string };
    userId: string;
    interactionDate: string;
    channel: number;
    subject: string;
    description: string;
    status: COMMON_STATUS;
    personInCharge?: PersonInCharge;
}

export interface ICustomerPersonInChargeRequest {
    customerId: string;
    userId: string;
    userName?: string;
    userPhone?: string;
    userEmail?: string;
    userPosition?: string;
}
