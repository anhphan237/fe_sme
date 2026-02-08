export interface PurchaseInvoiceAttachment {
    id: string;
    name: string;
    description: string;
    extension: string;
    path: string;
    created: string;
    lastModified: string;
    status?: 'done' | 'uploading' | 'error';
}

export interface PurchaseInvoiceSupplier {
    id: string;
    supplierId: string;
    supplierCode: string;
    supplierName: string;
    supplierPhone: string;
    supplierAddress: string;
    supplierTaxCode: string;
    supplierContactPerson: string;
    supplierContactPersonPhone: string;
    supplierBankAccountName: string;
    supplierBankAccountNumber: string;
    supplierBankName: string;
    supplierBankBranch: string;
    supplierShortName: string;
    currentSupplier?: any;
    created: string;
    lastModified: string;
    _original?: Record<string, any>;
}

export interface PurchaseInvoicePersonInCharge {
    id: string;
    userId: string;
    userCode: string;
    userName: string;
    userPhone: string;
    userPosition: string;
}

export interface PurchaseInvoiceProductDetail {
    id: string;
    productId: string;
    productCode: string;
    productName: string;
    productType: string;
    productGroup: string;
    unit: string;
    quantity: number;
    amount: number;
    weight: number;
    importprice: number;
    description: string;
    number: number;
    returnedQuantity: number;
    remainingQuantity: number;
    created: string;
    lastModified: string;
}

export interface IAddEditPurchaseInvoice {
    id: string;
    code: string;
    purchaseId: string;
    purchaseCode: string;
    purchaseDate: string;
    isSaveAdd?: boolean;

    status: number;
    description: string;
    createdBy: string;
    createdByName: string;
    created: string;
    lastModified: string;
    lastModifiedBy: string;
    lastModifiedByName: string;
    totalAmount: number;
    totalAmountPaid: number;
    totalAmountRefunded: number;
    totalQuantity: number;
    remainingAmount?: number;
    debtDocumentId?: string;
    supplier: PurchaseInvoiceSupplier;
    personInCharge: PurchaseInvoicePersonInCharge;
    details: PurchaseInvoiceProductDetail[];
    attachments?: PurchaseInvoiceAttachment[];
    _attachmentPath?: string;
}

export interface PurchaseInvoiceItem {
    id: string;
    code: string;
    invoice: string;
    invoiceDate: string;
    purchaseId: string;
    purchaseInvoice: string;
    totalAmount: number;
    totalAmountPaid: number;
    totalQuantity: number;
    status: number;
    debtDocumentId?: string;
    warehouse: {
        warehouseName: string;
    };
    supplier: {
        supplierTaxCode: string;
        supplierContactPerson: string;
        supplierWarehouseName: string;
        supplierName: string;
        supplierContactPersonPhone: string;
        supplierPhone: string;
    };
    personInCharge: {
        userName: string;
    };
    created: string;
    createdBy: string;
    createdByName: string;
    lastModified: string;
    lastModifiedBy: string;
    lastModifiedByName: string;
}
