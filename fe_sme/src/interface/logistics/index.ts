import { GOODS_RECEIPT_ISSUE_TYPE } from '@/constants/logistics';

export interface WarehouseDetail {
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
}

export interface WarehouseInfo {
    id: string;
    goodsReceiptIssueId: string;
    warehouseId: string;
    warehouseTypeCode: string;
    warehouseTypeName: string;
    warehouseCode: string;
    warehouseName: string;
    listWarehouses: any;
}

export interface WarehouseCustomer {
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
}

export interface WarehouseDelivery {
    id: string;
    goodsReceiptIssueId: string;
    deliveryDate: string;
    deliveryTime: string;
    deliveryAddress: string;
    deliveryNote: string;
    listDeliveryItems: any;
}

export interface WarehousePersonInCharge {
    id: string;
    goodsReceiptIssueId: string;
    userId: string;
    userCode: string;
    userName: string;
    userPhone: string;
    userPosition: string;
}

export interface IAddEditWarehouse {
    id: string;
    type?: GOODS_RECEIPT_ISSUE_TYPE;
    invoice: string;
    invoiceDate: string;
    status: number;
    description: string;
    createdByName: string;
    isSaveAdd?: boolean;
    listUsers: any;
    details: WarehouseDetail[];
    warehouse: WarehouseInfo;
    customer: WarehouseCustomer;
    delivery: WarehouseDelivery;
    personInCharge: WarehousePersonInCharge;
    contractId?: string;
}

export interface IAddEditWarehouseConfig {
    colorCode?: string;
    created?: string;
    description?: string;
    deviationMeasurement?: number;
    miniumQuantity?: number;
    id?: string;
    lastModified?: string;
    name?: string;
    code?: string;
}
