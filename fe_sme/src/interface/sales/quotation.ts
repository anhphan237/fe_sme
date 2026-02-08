import { QUOTATION_CALCULATION_TYPE } from '@/constants/sales/quotation';

export interface FormQuotation {
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
    customer: Customer;
    delivery: Delivery;
    personInCharge: PersonInCharge;
    warehouse: Warehouse;
    details: ProductDetail[];
    attachments: QuotationAttachment[];
    approval?: QuotationApproval;
    debtDocumentId?: string;
    remainingAmount?: number;
    isDraft?: boolean;
    status?: number;
    paymentHistorys?: PaymentHistory[];
    _attachmentPath?: string; // Path to store attachments
    _continueToAdd: boolean;
    _quickPay: boolean;
}

export interface QuotationAttachment {
    id: string;
    quotationIssueId: string;
    name: string;
    description: string;
    extension: string;
    path: string;
    created: string;
    lastModified: any;

    // only for form
    status?: 'done' | 'uploading' | 'error'; // Status of the attachment upload
}

export interface Customer {
    customerId: string;
    quotationIssueId: string;
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
    customerShortName: string;
    ourWarehouse: boolean; // true: khách tự đến lấy hàng, kho không còn required

    _original?: Record<string, any>; // Original data from the server
}

export interface Delivery {
    personnel: string;
    phone: string;
    licensePlate: string;
    description: string;
    quotationIssueId: string;
}

export interface PersonInCharge {
    userId: string;
    userCode: string;
    userName: string;
    userPhone: string;
    userEmail: string;
    userPosition: string;
    quotationIssueId: string;
}

export interface Warehouse {
    warehouseId: string;
    warehouseTypeCode: string;
    warehouseTypeName: string;
    warehouseCode: string;
    warehouseName: string;
    warehouseAddress: string;
    quotationIssueId: string;
}

export interface ProductDetail {
    id?: string;
    productId: string;
    productCode: string;
    productName: string;
    productNameView: string;
    productType: string;
    productGroup: string;
    unit: string; // Đơn vị
    quantity: number; // Số lượng
    mac?: string; // Mac
    productOrigin?: string; // Xuat xu
    description?: string;
    quantityInStock?: number;
    weightActual: number; // trọng lượng thực tế
    weightTheoretical: number; // trọng lượng lý thuyết
    weightDeviation: number; // trọng lượng chênh lệch
    sellingPrice: number; // Đơn giá
    importprice: number; // Giá nhập
    amount: number; // Thành tiền
    supplierId?: string;
    supplierPrice?: number; // giá nguồn dùng trong trường hợp hàng ko có trong kho
    calculateBy: QUOTATION_CALCULATION_TYPE; // required khi supplierPrice > 0
    supplierLocation?: string; // required khi supplierPrice > 0
    supplierCalculateBy?: QUOTATION_CALCULATION_TYPE; // required khi supplierPrice > 0
    quotationIssueId: string;
    weight: number;
    returnQuantity?: number;
    // _outputConvert: number; // trọng lượng lý thuyết cho 1 đơn vị
    _inventoryData?: number; // Dữ liệu kho hàng liên quan đến sản phẩm này
    _isPromotional?: boolean; // Sản phẩm khuyến mãi

    items?: {
        multiplier: number;
        width: number;
        length: number;
    }[];
    unitCode?: string;
    unitName?: number;
    suggestAttributeJson?: string;
}

/** for list */
export interface ProductItem extends Omit<ProductDetail, '_outputConvert'> {
    id: string;
    quotationIssueId: string;
    created: string;
    lastModified: any;
}

export interface PersonInChargeItem extends PersonInCharge {
    id: string;
    quotationIssueId: string;
}

export interface DeliveryItem extends Delivery {
    id: string;
    quotationIssueId: string;
}

export interface CustomerItem extends Omit<Customer, '_original'> {
    customerWarehouseName: string;
    customerWarehouseAddress: string;
    customerWarehouseDescription: any;
}

export interface WarehouseItem extends Warehouse {
    id: string;
    quotationIssueId: string;
    created: string;
    lastModified: any;
}

export interface QuotationApproval {
    isAccountApprover: boolean;
    id: string;
    quotationIssueId: string;
    description: string;
    userId: string;
    userCode: string;
    userName: string;
    userPhone: string;
    userPosition: string;
    requestedDate: string;
    approvedDate: string;
}

export interface QuotationItem {
    customer: CustomerItem;
    warehouse: WarehouseItem;
    delivery: DeliveryItem;
    personInCharge: PersonInChargeItem;
    details: ProductItem[];
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
    description: any;
    suggestPrice: any;
    suggestDeliveryFee: string;
    created: string;
    createdBy: string;
    createdByName: string;
    lastModified: string;
    lastModifiedBy: string;
    lastModifiedByName: string;
    approval?: QuotationApproval;
}

// for calculator
export interface SellingPriceCalculator {
    totalAmount: number;
    detail: SellingPriceCalculatorDetail[];
}

export interface SellingPriceCalculatorDetail {
    productId: string;
    productCode: string;
    productName: string;
    quantity: number;
    sellingPrice: number;
    amount: number;
    calculateBy: number;
    barem: SellingPriceCalculatorBarem[];
    actual: SellingPriceCalculatorActual[];
    item: SellingPriceCalculatorItem[];
}

export interface SellingPriceCalculatorBarem {
    sellingPrice: number;
    weight: number;
}

export interface SellingPriceCalculatorActual {
    sellingPrice: number;
    weight: number;
}

export interface SellingPriceCalculatorItem {
    sellingPrice: number;
    weight: number;
}

export interface Inventory {
    productId: string;
    productName: string;
    productCode: string;
    productNameView: string;
    quantity: {
        goodsIssueTotal: number;
        goodsReceiptTotal: number;
        quotationTotal: number;
        baremTotal: number;
        quantityTotal: number;
    };
    warehouses: Pick<Warehouse, 'warehouseId' | 'warehouseName' | 'warehouseCode'>[];
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
