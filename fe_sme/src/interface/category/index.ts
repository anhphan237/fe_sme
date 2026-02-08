export interface ICategoryData {
    id: string;
    code: string;
    name: string;
    created: string;
    lastModified: any;
}

export interface IAddEditCategory {
    id?: string;
    code: string;
    name: string;
}

export class CategoryForm implements IAddEditCategory {
    id?: string | undefined = '';
    code: string = '';
    name: string = '';
}

export interface IAddEditProduct {
    id?: string;
    code?: string;
    name?: string;
    description?: string;
    image?: string;
    inputConvert?: number;
    outputConvert?: number;
    productTypeId?: string;
    productUnitId?: string;
    productTypeName?: string;
    productUnitName?: string;
    productGroupName?: string;
    productType?: {
        id?: string;
        name?: string;
        productGroupName?: string;
        productGroupId?: string;
    };
    productUnit?: {
        name?: string;
        id?: string;
    };
    isSaveAdd?: boolean;
    productGroupId?: string;
    nameView?: string;
    attributeJson?: any;
}

export interface IAddEditProductType {
    id?: string;
    code?: string;
    name?: string;
    productGroupId?: string;
    productGroupName?: string;
}

export interface IAddEditProductGroup {
    id?: string;
    code?: string;
    name?: string;
}

export interface IAddEditSalesChannel {
    id?: string;
    code?: string;
    name?: string;
}

export interface IAddEditSalesMethod {
    id?: string;
    code?: string;
    name?: string;
}

export interface IAddEditCustomerType {
    id?: string;
    code?: string;
    name?: string;
}
export interface IAddEditPartnerType {
    id?: string;
    code?: string;
    name?: string;
}

export interface IAddEditPaymentMethod {
    id?: string;
    code?: string;
    name?: string;
}

export interface IAddEditDeliveryMethod {
    id?: string;
    code?: string;
    name?: string;
}

export interface IAddEditShippingMethod {
    id?: string;
    code?: string;
    name?: string;
}

export interface IAddEditShippingFee {
    id?: string;
    code?: string;
    name?: string;
}

export interface IAddEditOrderStatus {
    id?: string;
    code?: string;
    name?: string;
}

export interface IAddEditWarehouseArea {
    id?: string;
    code?: string;
    name?: string;
}

export interface IAddEditPosition {
    id?: string;
    code?: string;
    name?: string;
    departmentName?: string;
}

export interface IAddEditDepartment {
    id?: string;
    code?: string;
    name?: string;
}

export interface IAddEditWarehouse {
    id?: string;
    code?: string;
    name?: string;
    warehouseTypeId?: string;
    warehouseTypeName?: string;
    administrativeDivision?: string;
    provinceId?: string;
    districtId?: string;
    wardId?: string;
    description?: string;
}

export interface IAddEditWarehouseArea {
    id?: string;
    code?: string;
    name?: string;
}
export interface IAddEditBusinessExpense {
    id?: string;
    code?: string;
    name?: string;
}

export interface IAddEditProductUnit {
    id?: string;
    code?: string;
    name?: string;
}

export interface IPositionByDepartment {
    departmentId: string;
    priority: number;
    departmentCode: string;
    departmentName: string;
    id: string;
    name: string;
    code: string;
}

export interface IAddEditPaymentFund {
    id?: string;
    code?: string;
    name?: string;
}

export interface IAddEditExpensesType {
    id?: string;
    code?: string;
    name?: string;
    isIncome?: boolean;
}
