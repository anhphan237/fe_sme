import { get } from 'lodash';

import { QUOTATION_CALCULATION_TYPE } from '@/constants/sales/quotation';

import { IAddEditWarehouseConfig } from '@/interface/logistics';
import { PurchaseProductDetail, PurchaseProductItem } from '@/interface/sales/purchase';
import { FormQuotation, ProductDetail, ProductItem } from '@/interface/sales/quotation';

import { DataItem } from './components/AddNewProductModal';

export class Helper {
    static productToForm(prd: DataItem, existingId?: string): Partial<ProductDetail> {
        return {
            ...(existingId && { id: existingId }),
            productId: prd.id,
            productCode: prd?.code,
            productName: prd?.name,
            productType: prd?.productType?.name,
            productGroup: prd?.productType?.productGroupName,
            unit: prd?.unit,
            quantity: prd?.quantity ?? 1,
            _inventoryData: prd?.quantityInStock || 1,
            sellingPrice: prd?.price || 0,
            amount: prd?.amount || 0,
            weight: prd?.weight,
        };
    }

    static formToProduct(formValues: FormQuotation['details'][number]): DataItem {
        return {
            id: formValues.productId,
            code: formValues.productCode,
            name: formValues.productName,
            productType: { name: formValues.productType, productGroupName: formValues.productGroup },
            unit: formValues.unit,
            quantity: formValues.quantity ?? 1,
            quantityInStock: formValues._inventoryData || 1,
            price: formValues.sellingPrice || 0,
            amount: formValues?.amount || 0,
            weight: formValues.weight,
        };
    }

    static purchaseProductToForm(prd: DataItem, existingId?: string): Partial<PurchaseProductDetail> {
        return {
            ...(existingId && { id: existingId }),
            productId: prd.id,
            productCode: prd?.code,
            productName: prd?.name,
            productType: prd?.productType?.name,
            productGroup: prd?.productType?.productGroupName,
            unit: prd?.unit,
            quantity: prd?.quantity ?? 1,
            _inventoryData: prd?.quantityInStock || 1,
            importprice: prd?.lastImportPrice || 0,
            amount: prd?.amount || 0,
            weight: prd?.weight,
        } as Partial<PurchaseProductDetail>;
    }

    static purchaseFormToProduct(formValues: PurchaseProductDetail | any): DataItem {
        return {
            id: formValues.productId,
            code: formValues.productCode,
            name: formValues.productName,
            productType: { name: formValues.productType, productGroupName: formValues.productGroup },
            unit: formValues.unit,
            quantity: formValues.quantity ?? 1,
            quantityInStock: formValues._inventoryData || 1,
            price: 0,
            lastImportPrice: formValues.importprice || 0,
            amount: formValues?.amount || 0,
            weight: formValues.weight,
        };
    }

    static calculateTotalPrice = (products: (ProductDetail | ProductItem)[]) => {
        return products.reduce((total: number, product: ProductDetail | ProductItem) => {
            const sellingPrice = product?.sellingPrice || 0;
            return total + sellingPrice;
        }, 0);
    };

    static sumUp = (
        products: (ProductDetail | ProductItem | PurchaseProductDetail | PurchaseProductItem)[],
        previousDebt?: number,
    ): {
        totalWeight: number;
        totalQuantity: number;
        totalSellingPrice: number;
        totalAmount: number;
    } => {
        return products.reduce(
            (
                acc: { totalWeight: number; totalQuantity: number; totalSellingPrice: number; totalAmount: number },
                product: ProductDetail | ProductItem | PurchaseProductDetail | PurchaseProductItem,
            ) => {
                const price = (product as any)?.importprice || product?.sellingPrice || 0;
                const weightActual = product?.weightActual || 0;
                const weight = product?.weight;
                const quantity = product?.quantity || 0;
                const amount = quantity * price * weight || 0;

                acc.totalSellingPrice += price;
                acc.totalWeight += weightActual * quantity;
                acc.totalQuantity += quantity;
                acc.totalAmount += amount;

                return acc;
            },
            {
                totalWeight: 0,
                totalQuantity: 0,
                totalSellingPrice: 0,
                totalAmount: previousDebt || 0,
            },
        );
    };

    static distanceBy(fieldPathItem: string | number | (string | number)[], products: ProductDetail[]) {
        const relativePath = Array.isArray(fieldPathItem) ? fieldPathItem : [fieldPathItem];
        const actualWeight = get(products, [...relativePath, 'weightActual']) || 0;
        const theoreticalWeight = get(products, [...relativePath, 'weightTheoretical']) || 0;
        if (!theoreticalWeight || !actualWeight)
            return {
                displayValue: '-',
                value: null,
            };
        const distancePercentage = Math.floor((Math.abs(actualWeight - theoreticalWeight) * 100) / theoreticalWeight);
        return {
            displayValue: `${distancePercentage}%`,
            value: distancePercentage,
        };
    }

    static getWarningNearestColor = (val: number | null, warehouseSettingData: IAddEditWarehouseConfig[]) => {
        const sortedSetting = warehouseSettingData.sort((a, b) => {
            const aDeviation = a.deviationMeasurement ?? 0;
            const bDeviation = b.deviationMeasurement ?? 0;
            if (!a.deviationMeasurement && !b.deviationMeasurement) return 0;
            return bDeviation - aDeviation;
        });
        if (val === null || val === undefined) return '#000';
        const colorCode = sortedSetting.find(setting => setting.deviationMeasurement && setting.deviationMeasurement <= val)?.colorCode;
        return colorCode ?? '#000';
    };
}

export const sellingPriceByItem = (data: any, type: 'sale' | 'purchase' = 'purchase') => {
    const costPrice = (type === 'purchase' ? data?.costPrice : data?.sellingPrice) || 0;
    const quantity = data?.quantity || 0;
    const weightTheoretical = data?.weightTheoretical || 0;
    const weightActual = data?.weightActual || 0;
    const calculateBy = data?.calculateBy || QUOTATION_CALCULATION_TYPE.BY_ITEM;
    const weight = data?.weight;
    let price;
    if (calculateBy === QUOTATION_CALCULATION_TYPE.BY_ITEM) {
        price = costPrice * quantity * weight;
    } else if (calculateBy === QUOTATION_CALCULATION_TYPE.BY_ACTUAL_WEIGHT) {
        price = costPrice * weightActual * quantity;
    } else if (calculateBy === QUOTATION_CALCULATION_TYPE.BY_THEORETICAL_WEIGHT) {
        price = costPrice * weightTheoretical * quantity;
    }
    return price;
};
