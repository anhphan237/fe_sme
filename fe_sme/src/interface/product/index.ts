import { QUOTATION_CALCULATION_TYPE } from '@/constants/sales/quotation';

export interface IProductData {
    id: string;
    name: string;
    nameView: string;
    code: string;
    description: string;
    image: string;
    price: number;
    /** @deprecated - use amount instead */
    costPrice: number;
    inputConvert: number;
    outputConvert: number;
    unit: string;
    productTypeId: string;
    productUnitId: string;
    productType: IProductType;
    productUnit: IProductUnit;
    created: string;
    lastModified: string;
    density: number;
    calculateBy: QUOTATION_CALCULATION_TYPE;
    amount: number;
    weight: number;
}

export interface IProductType {
    productGroupId: string;
    productGroupCode: string;
    productGroupName: string;
    id: string;
    name: string;
    code: string;
    created: string;
    lastModified: string;
}

export interface IProductUnit {
    id: string;
    name: string;
    code: string;
    created: string;
    lastModified: string;
}

export interface IAddEditProduct {
    id?: string;
    name: string;
    description: string;
    image: string;
    price: number;
    costPrice: number;
    unit: string;
    categoryId: string;
}

export type IProductForm = IAddEditProduct & {
    code: string;
};

export class ProductForm implements IProductForm {
    image: string = '';
    code: string = '';
    name: string = '';
    categoryId: string = '';
    price: number = 0;
    costPrice: number = 0;
    unit: string = '';
    description: string = '';
}

export interface IProductHistory {
    orderId: string;
    orderCode: string;
    invoiceDate: string;
    totalQuantity: number;
    sellingPrice: number;
    statistic?: {
        totalSelling: number;
        profit: number;
    };
}
