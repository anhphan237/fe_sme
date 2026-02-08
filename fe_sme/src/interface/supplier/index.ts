import { COMMON_STATUS } from '@/core/components/Status/PaymentTag';

export interface ISupplierContactPerson {
    id?: string;
    name: string;
    phone: string;
    position?: string;
    description?: string;
    number?: number;
}

export interface ISupplierBankAccount {
    id?: string;
    bankAccountName: string;
    bankAccountNumber: string;
    bankName: string;
    bankBranch?: string;
    description?: string;
    number?: number;
}

export interface ISupplierProductType {
    productTypeId: string;
    name: string;
    code: string;
}

export interface ISupplierData {
    id: string;
    supplierTypeId?: string;
    supplierTypeCode?: string;
    supplierTypeName?: string;
    code?: string;
    name: string;
    nameShort?: string;
    phone?: string;
    email?: string;
    address?: string;
    description?: string;
    taxCode?: string;
    supplierProductTypeIds?: string[];
    supplierProductTypes?: ISupplierProductType[];
    created: string;
    createdBy?: string;
    createdByName?: string;
    lastModified?: string;
    lastModifiedBy?: string;
    lastModifiedByName?: string;
    supplierContactPersons?: ISupplierContactPerson[];
    supplierBankAccounts?: ISupplierBankAccount[];
}

export interface ISupplierPersonInCharge {
    userId: string;
    userName?: string;
    userPhone?: string;
    userEmail?: string;
    userPosition?: string;
}

export interface IAddEditSupplier {
    id?: string;
    supplierTypeId: string;
    name: string;
    nameShort?: string;
    phone?: string;
    email?: string;
    address?: string;
    description?: string;
    taxCode?: string;
    supplierPersonInCharge?: ISupplierPersonInCharge;
    supplierProductTypeIds?: ISupplierProductType[];
    supplierContactPersons?: ISupplierContactPerson[];
    supplierBankAccounts?: ISupplierBankAccount[];
}

interface PersonInCharge {
    id: string;
    supplierTrackingId: string;
    userId: string;
    userCode: string;
    userName: string;
    userPhone: string;
    userPosition: string;
}

export interface IHistorySupplierInteraction {
    id: string;
    supplierId: string;
    supplier: { name: string; nameShort: string };
    userId: string;
    interactionDate: string;
    channel: number;
    subject: string;
    description: string;
    status: COMMON_STATUS;
    personInCharge?: PersonInCharge;
}

export interface IResSupplierHistory {
    id: string;
    code?: string;
    totalQunatity: number;
    totalAmount: number;
    supplierId: string;
    supplierCode: string;
    supplierName: string;
    supplierPhone: string;
    status: COMMON_STATUS;
    type: number;
    lastModified: string;
}
