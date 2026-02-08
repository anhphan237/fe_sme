export interface IContract {
    employeeName: string; // Employee full name
    employeeCode: string; // Employee code
    jobPosition?: string; // Job position
    signingDate: string; // Contract signing date
    contractType: string; // Contract type
    workForm?: string; // Form of employment
    expirationDate?: string; // Contract expiration date
    effectiveDate: string; // Effective date
    contractNumber: string; // Contract number
    contractTitle?: string; // Contract title
    signingDepartment: string; // Department signing the contract (marked for removal)
    baseSalary: number; // Base salary
    salaryRate: number; // Salary rate (%)
    insuranceSalary?: number; // Salary used for insurance calculation
    contractSigner: string; // Person signing the contract (previously: companyRepresentative)
    responsiblePerson?: string; // Person in charge (previously: representativeTitle)
    summary?: string; // Contract summary or main points
    attachmentFile?: string; // Attached file (path or file name)
    note?: string; // Additional notes
    signingStatus?: string; // Contract signing status
}

export interface IAddEditPurchaseContract {
    id: string;
    invoice: string;
    invoiceDate: string;
    status: number;
    description: string;
    createdByName: string;
    isSaveAdd?: boolean;
    listUsers: any;
    details: {
        id: string;
        goodsReceiptIssueId: string;
        productId: string;
        productCode: string;
        productName: string;
        productNameView: string;
        productType: string;
        productGroup: string;
        unit: string;
        quantity: number;
        weightActual: number;
        weightTheoretical: number;
        weightDeviation: number;
        costPrice: number;
        sellingPrice: number;
    }[];
    warehouse: {
        id: string;
        goodsReceiptIssueId: string;
        warehouseId: string;
        warehouseTypeCode: string;
        warehouseTypeName: string;
        warehouseCode: string;
        warehouseName: string;
        listWarehouses: any;
    };
    customer: {
        id: string;
        goodsReceiptIssueId: string;
        customerId: string;
        supplier: true;
        customerCode: string;
        customerName: string;
        customerPhone: string;
        customerAddress: string;
        customerTaxCode: string;
        customerContactPerson: string;
        customerContactPersonPhone: string;
        customerBankAccountName: string;
        customerBankAccountNumber: string;
        customerBankName: string;
        customerBankBranch: string;
        listCustomers: any;
        currentCustomer: any;
    };
    delivery: {
        id: string;
        goodsReceiptIssueId: string;
        personnel: string;
        phone: string;
        licensePlate: string;
        description: string;
    };
    personInCharge: {
        id: string;
        goodsReceiptIssueId: string;
        userId: string;
        userCode: string;
        userName: string;
        userPhone: string;
        userPosition: string;
    };
}

export interface ContractAttachment {
    id: string;
    name: string;
    description: string;
    extension: string;
    path: string;
    created: string;
    lastModified: any;

    // only for form
    status?: 'done' | 'uploading' | 'error'; // Status of the attachment upload
}

export interface IAddEditInvoice {
    id: string;
    invoice: string;
    invoiceDate: string;
    status: number;
    description: string;
    createdByName: string;
    isSaveAdd?: boolean;
    listUsers: any;
    details: {
        id: string;
        goodsReceiptIssueId: string;
        productId: string;
        productCode: string;
        productName: string;
        productNameView: string;
        productType: string;
        productGroup: string;
        unit: string;
        quantity: number;
        weightActual: number;
        weightTheoretical: number;
        weightDeviation: number;
        costPrice: number;
        sellingPrice: number;
    }[];
    warehouse: {
        id: string;
        goodsReceiptIssueId: string;
        warehouseId: string;
        warehouseTypeCode: string;
        warehouseTypeName: string;
        warehouseCode: string;
        warehouseName: string;
        listWarehouses: any;
    };
    customer: {
        id: string;
        goodsReceiptIssueId: string;
        customerId: string;
        supplier: true;
        customerCode: string;
        customerName: string;
        customerPhone: string;
        customerAddress: string;
        customerTaxCode: string;
        customerContactPerson: string;
        customerContactPersonPhone: string;
        customerBankAccountName: string;
        customerBankAccountNumber: string;
        customerBankName: string;
        customerBankBranch: string;
        listCustomers: any;
        currentCustomer: any;
    };
    delivery: {
        id: string;
        goodsReceiptIssueId: string;
        personnel: string;
        phone: string;
        licensePlate: string;
        description: string;
    };
    personInCharge: {
        id: string;
        goodsReceiptIssueId: string;
        userId: string;
        userCode: string;
        userName: string;
        userPhone: string;
        userPosition: string;
    };
    attachments?: ContractAttachment[];
    paymentHistorys?: PaymentHistory[];
}

export interface IContract {
    customer: ContractCustomer;
    delivery: ContractDelivery;
    personInCharge: ContractPersonInCharge;
    details: ContractDetail[];
    id: string;
    invoice: string;
    invoiceDate: string;
    deliveryDate: string;
    receiptDate: string;
    totalQuantity: number;
    totalWeight: number;
    discountAmount: number;
    advancedAmount: number;
    deliveryFee: number;
    totalAmount: number;
    status: number;
    description: any;
    created: string;
    createdBy: string;
    createdByName: any;
    lastModified: any;
    lastModifiedBy: any;
    lastModifiedByName: any;
}

export interface ContractCustomer {
    id: string;
    goodsReceiptIssueId: string;
    customerId: string;
    supplier: boolean;
    customerCode: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerTaxCode: string;
    customerContactPerson: string;
    customerContactPersonPhone: string;
    customerBankAccountName: string;
    customerBankAccountNumber: string;
    customerBankName: string;
    customerBankBranch: string;
    customerWarehouseName: string;
    customerWarehouseAddress: string;
    customerWarehouseDescription: string;
    created: string;
    lastModified: string;
}

export interface ContractDelivery {
    id: string;
    goodsReceiptIssueId: string;
    personnel: string;
    phone: string;
    licensePlate: string;
    description: string;
    created: string;
    lastModified: string;
}

export interface ContractPersonInCharge {
    id: string;
    contactId: string;
    userId: string;
    userCode: string;
    userName: string;
    userPhone: string;
    userPosition: string;
}

export interface ContractDetail {
    id: string;
    goodsReceiptIssueId: string;
    productId: string;
    productCode: string;
    productName: string;
    productNameView: string;
    productType: string;
    productGroup: string;
    unit: string;
    quantity: number;
    weightActual: number;
    weightTheoretical: number;
    weightDeviation: number;
    costPrice: number;
    sellingPrice: number;
    created: string;
    lastModified: string;
}

export interface PaymentHistory {
    personInCharge?: string;
    remainingAmountAfterPayment?: number;
    amount: number;
    transactionDate: string;
    reasonReturn?: string;
    paymentMethod: string;
    paymentType: string;
}
