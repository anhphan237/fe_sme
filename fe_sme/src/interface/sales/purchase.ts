import { PURCHASE_CALCULATION_TYPE } from '@/constants/sales/purchase';

export interface FormPurchase {
    id?: string;
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
    description: string;
    previousDebt: number;
    supplier: PurchaseSupplier;
    delivery: PurchaseDelivery;
    personInCharge: PurchasePersonInCharge;
    warehouse: PurchaseWarehouse;
    details: PurchaseProductDetail[];
    attachments?: PurchaseAttachment[];
    approval?: PurchaseApproval;
    debtDocumentId?: string;
    remainingAmount?: number;
    isDraft?: boolean;
    status?: number;
    _attachmentPath?: string;
    _continueToAdd: boolean;
    _quickPay: boolean;
}

export interface PurchaseAttachment {
    id: string;
    purchaseIssueId: string;
    name: string;
    description: string;
    extension: string;
    path: string;
    created: string;
    lastModified: string;
    status?: 'done' | 'uploading' | 'error';
}

export interface PurchaseSupplier {
    supplierId: string;
    purchaseIssueId: string;
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
    _original?: Record<string, any>;
}

export interface PurchaseDelivery {
    personnel: string;
    phone: string;
    licensePlate: string;
    description: string;
    purchaseIssueId: string;
}

export interface PurchasePersonInCharge {
    userId: string;
    userCode: string;
    userName: string;
    userPhone: string;
    userEmail: string;
    userPosition: string;
    purchaseIssueId: string;
}

export interface PurchaseWarehouse {
    warehouseId: string;
    warehouseTypeCode: string;
    warehouseTypeName: string;
    warehouseCode: string;
    warehouseName: string;
    warehouseAddress: string;
    purchaseIssueId: string;
}

export interface PurchaseProductDetail {
    productId: string;
    productCode: string;
    productName: string;
    productNameView: string;
    productType: string;
    productGroup: string;
    unit: string;
    quantity: number;
    quantityInStock?: number;
    weightActual: number;
    weightTheoretical: number;
    weightDeviation: number;
    importprice: number;
    sellingPrice: number;
    amount: number;
    supplierId?: string;
    supplierPrice?: number;
    calculateBy: PURCHASE_CALCULATION_TYPE;
    supplierLocation?: string;
    supplierCalculateBy?: PURCHASE_CALCULATION_TYPE;
    purchaseIssueId: string;
    weight: number;
    _inventoryData?: number;
    _isPromotional?: boolean;
}

export interface PurchaseProductItem extends Omit<PurchaseProductDetail, '_inventoryData' | '_isPromotional'> {
    id: string;
    purchaseIssueId: string;
    created: string;
    lastModified: string;
}

export interface PurchasePersonInChargeItem extends PurchasePersonInCharge {
    id: string;
    purchaseIssueId: string;
}

export interface PurchaseDeliveryItem extends PurchaseDelivery {
    id: string;
    purchaseIssueId: string;
}

export interface PurchaseSupplierItem extends Omit<PurchaseSupplier, '_original'> {
    supplierWarehouseName?: string;
    supplierWarehouseAddress?: string;
    supplierWarehouseDescription?: string;
}

export interface PurchaseWarehouseItem extends PurchaseWarehouse {
    id: string;
    purchaseIssueId: string;
    created: string;
    lastModified: string;
}

export interface PurchaseApproval {
    isAccountApprover: boolean;
    id: string;
    purchaseIssueId: string;
    description: string;
    userId: string;
    userCode: string;
    userName: string;
    userPhone: string;
    userPosition: string;
    requestedDate: string;
    approvedDate: string;
}

export interface PurchaseItem {
    supplier: PurchaseSupplierItem;
    warehouse: PurchaseWarehouseItem;
    delivery: PurchaseDeliveryItem;
    personInCharge: PurchasePersonInChargeItem;
    details: PurchaseProductItem[];
    id: string;
    invoice: string;
    invoiceDate: string;
    deliveryDate: string;
    previousDebt: number;
    receiptDate: string;
    totalQuantity: number;
    totalWeight: number;
    discountAmount: number;
    advancedAmount: number;
    deliveryFee: number;
    totalAmount: number;
    status: number;
    description: string;
    suggestPrice?: string;
    suggestDeliveryFee?: string;
    created: string;
    createdBy: string;
    createdByName: string;
    lastModified: string;
    lastModifiedBy: string;
    lastModifiedByName: string;
    approval?: PurchaseApproval;
}
