import { apiGetFileFromPath } from '@/api/file.api';
import { APP_CONFIG, DefaultRoles, ERROR_CODE, OrderStatus } from '@/constants';
import { IDebtInfoLocalStorage, IDebtInfoLocalStorageValue, IWarehouseTransactionInfo, IWarehouseTransactionInfoValue } from '@/types';
import { SelectProps } from 'antd';
import { DefaultOptionType } from 'antd/es/select';
import { AxiosResponse } from 'axios';
import moment from 'moment';
import { ValidationError, object } from 'yup';

import { notify } from '@/components/toast-message';

import { JWTDecode } from '@/interface/user';

type LabelInValueType = Parameters<NonNullable<SelectProps['labelRender']>>[0];

export function uuidV4() {
    const uuid = new Array(36);
    for (let i = 0; i < 36; i++) {
        uuid[i] = Math.floor(Math.random() * 16);
    }
    uuid[14] = 4;
    uuid[19] = uuid[19] &= ~(1 << 2);
    uuid[19] = uuid[19] |= 1 << 3;
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
    return uuid.map(x => x.toString(16)).join('');
}

export function formatCurrency(value: number, style: 'decimal' | 'percent' | 'currency' = 'currency'): string {
    const newValue = new Intl.NumberFormat('vi-VN', { style, currency: 'VND' }).format(value);
    if (newValue === 'NaN') return '';
    return newValue;
}

export const yupValidate = async (yupSchema: any, data: any) => {
    const formError: any = {};
    Object.keys(yupSchema).forEach((key: string) => {
        formError[key] = {
            isValid: true,
            message: '',
        };
    });
    let isFormValid = true;
    await object()
        .shape(yupSchema)
        .validate(data, { abortEarly: false })
        .catch((errors: ValidationError) => {
            errors.inner.forEach((error: ValidationError) => {
                // only catch first error
                const fieldKey = error.path;
                if (fieldKey && formError[fieldKey].isValid) {
                    formError[fieldKey].isValid = false;
                    formError[fieldKey].message = error.message;
                }
            });
            if (errors.inner.length > 0) {
                isFormValid = false;
            }
        });
    return {
        isValid: isFormValid,
        formError,
    };
};

export const getDefaultFormError = (fields: string[]) => {
    const form: any = {};
    for (const field of fields) {
        form[field] = {
            isValid: true,
            message: '',
        };
    }
    return form;
};

export const getOrderStatus = (statusCode: string | number) => {
    const orderStatus = OrderStatus.find(s => String(s.code) === String(statusCode));
    if (orderStatus) return orderStatus.name;
    return '-';
};

export const isContainOr = (search: string, values: (string | number | undefined)[]) => {
    let contain = false;
    values.forEach(value => {
        if (!value) return;
        if (String(value).toLowerCase().includes(String(search).toLowerCase())) {
            contain = true;
        }
    });
    return contain;
};

export const parseJwt = (token: string) => {
    try {
        if (!token) return null;
        const base64Url = token?.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            window
                .atob(base64)
                .split('')
                .map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                })
                .join(''),
        );
        return JSON.parse(jsonPayload) as JWTDecode;
    } catch (e) {
        console.error(e);
    }
    return null;
};

// Convert vietnamese to lowercase for case-insensitive comparison
export const removeViDiacritics = (text: string): string => {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
};

export const decodeJson = <T>(json: string) => {
    try {
        const decoded = decodeURIComponent(json);
        return JSON.parse(decoded) as T;
    } catch (error) {
        console.error('Error decoding JSON:', error);
        return null;
    }
};

export const formatMoney = (amount: number) => {
    return `${formatNumber(amount, 0)} đ`;
};

export const formatNumber = (input?: string | number, decimalPlaces = 2) => {
    const number = Number(input);
    if (isNaN(number)) return '';

    const fixed = number.toFixed(decimalPlaces);
    const [integerPart, decimalPart] = fixed.split('.');
    const formattedInteger = new Intl.NumberFormat('en-US').format(Number(integerPart));
    if (!decimalPart || /^0+$/.test(decimalPart)) {
        return formattedInteger;
    }

    return `${formattedInteger}.${decimalPart}`;
};

// export const formatNumberWithUnit = (value: number | undefined, decimalPlaces = 2): string => {
//     if (!value || value === 0) return '0';

//     const absValue = Math.abs(value);

//     if (absValue >= 1_000_000_000) {
//         return `${formatNumber(value / 1_000_000_000, decimalPlaces)} tỷ`;
//     }

//     if (absValue >= 1_000_000) {
//         return `${formatNumber(value / 1_000_000, decimalPlaces)} triệu`;
//     }

//     if (absValue >= 1_000) {
//         return `${formatNumber(value / 1_000, decimalPlaces)} nghìn`;
//     }

//     return formatNumber(value, 0);
// };

// export const formatCurrencyWithUnit = (value: number | undefined, decimalPlaces = 2): string => {
//     if (!value || value === 0) return '0 đ';

//     const absValue = Math.abs(value);

//     if (absValue >= 1_000_000_000) {
//         return `${formatNumber(value / 1_000_000_000, decimalPlaces)} tỷ`;
//     }

//     if (absValue >= 1_000_000) {
//         return `${formatNumber(value / 1_000_000, decimalPlaces)} triệu`;
//     }

//     if (absValue >= 1_000) {
//         return `${formatNumber(value / 1_000, decimalPlaces)} nghìn`;
//     }

//     return `${formatNumber(value, 0)} đ`;
// };

export class FileHelper {
    static downloadFromBlob(blob: Blob, fileName: string) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    static async downloadFileFromResponse(response: AxiosResponse<{ filePath?: string }>) {
        try {
            const { filePath: filePathResponse } = response?.data;
            if (!filePathResponse) {
                throw new Error('response is null');
            }
            let filePath = filePathResponse;
            const fileName = filePath.split('/').pop();
            const dataBlob = await apiGetFileFromPath(filePath);
            FileHelper.downloadFromBlob(dataBlob as any, fileName ?? 'export.xlsx');
        } catch (error) {
            console.error('Error downloading file:', error);
            throw error;
        }
    }
}

export class SelectHelper {
    static labelRender(value: LabelInValueType | undefined, data: Record<string, any>, [keyLabel, keyValue]: [string, string] = ['name', 'id']) {
        const originDisplay = value?.label ?? value?.value;
        if (Array.isArray(data)) {
            const matched = data.find((item: any) => item?.[keyValue] === value?.value);
            return matched?.[keyLabel] ?? undefined;
        } else if (typeof data === 'object') {
            const isMatched = data?.[keyValue] === value?.value;
            return isMatched ? data?.[keyLabel] : undefined;
        }
        return originDisplay;
    }
}

export const InputHelper = {
    formatNumber: (value: string | number, addonAfter?: string) => {
        if (typeof value === 'number') {
            return `${formatNumber(value)}${addonAfter ? ` ${addonAfter}` : ''}`;
        }
        const number = Number(value);
        if (isNaN(number)) return '';
        return `${formatNumber(value)}${addonAfter ? ` ${addonAfter}` : ''}`;
    },
};

export const handleCommonError = (error: any, intl: (t: string) => string, defaultMessage: string = 'message.failed') => {
    const errorCode = error?.errorCode || error?.code;
    switch (errorCode) {
        case ERROR_CODE.CUSTOMER_IS_USED:
            notify.error(intl('global.message.customer_is_used'));
            break;
        case ERROR_CODE.PRODUCT_GROUP_IS_USED:
            notify.error(intl('global.message.product_group_is_used'));
            break;
        case ERROR_CODE.PRODUCT_TYPE_IS_USED:
            notify.error(intl('global.message.product_type_is_used'));
            break;
        case ERROR_CODE.PRODUCT_UNIT_IS_USED:
            notify.error(intl('global.message.product_unit_is_used'));
            break;
        case ERROR_CODE.PRODUCT_IS_USED:
            notify.error(intl('global.message.product_is_used'));
            break;
        case ERROR_CODE.SUPPLIER_TYPE_IS_USED:
            notify.error(intl('global.message.supplier_type_is_used'));
            break;
        case ERROR_CODE.CUSTOMER_TYPE_IS_USED:
            notify.error(intl('global.message.customer_type_is_used'));
            break;
        case ERROR_CODE.DUPLICATED_CUSTOMER_PHONE:
            notify.error(intl('customer.message.duplicated_phone'));
            break;
        case ERROR_CODE.USER_DUPLICATE_EMAIL:
            notify.error(intl('user.message.error.duplicated_email'));
            break;
        case ERROR_CODE.USER_DUPLICATE_USERNAME:
            notify.error(intl('user.message.error.duplicated_username'));
            break;
        case ERROR_CODE.USER_DUPLICATE_PHONE:
            notify.error(intl('user.message.error.duplicated_phone'));
            break;
        case ERROR_CODE.PAYMENT_SLIP_IS_PAID:
            notify.error(intl('finance_accounting.payment_slip.messsage.error.is_paid'));
            break;
        case ERROR_CODE.PURCHASE_ORDER_INSUFFICIENT_STOCK:
            notify.error(intl('sales_purchase_order.message.error.insufficient_stock'));
            break;
        case ERROR_CODE.SUPPLIER_DUPLICATE_PHONE:
            notify.error(intl('supplier.message.duplicated_phone'));
            break;
        case ERROR_CODE.EXPORT_NO_DATA:
            notify.error(intl('global.message.export_no_data'));
            break;
        case ERROR_CODE.EXPORT_ORDER_FAILED:
            notify.error(intl('global.message.export_failed'));
            break;
        case ERROR_CODE.EXPORT_INVOICE_FAILED:
            notify.error(intl('global.message.export_failed'));
            break;
        case ERROR_CODE.EXPORT_PAYMENTSLIP_FAILED:
            notify.error(intl('global.message.export_failed'));
            break;
        case ERROR_CODE.EXPORT_DEBT_FAILED:
            notify.error(intl('global.message.export_failed'));
            break;
        case ERROR_CODE.PRODUCT_DUPLICATE_CODE:
            notify.error(intl('product.message.duplicate_product_code'));
            break;
        case ERROR_CODE.EXPORT_DEBT_TRACKING:
            notify.error(intl('global.message.export_failed'));
            break;
        case ERROR_CODE.PAYMENT_FUND_IS_DUPLICATED:
            notify.error(intl('payment_fund.message.duplicated_payment_fund'));
            break;
        case ERROR_CODE.PAYMENT_FUND_IS_USED:
            notify.error(intl('global.message.payment_fund_is_used'));
            break;
        case ERROR_CODE.EXPENSES_TYPE_DUPLICATE_CODE:
            notify.error(intl('expenses_type.message.duplicate_expenses_type_code'));
            break;
        case ERROR_CODE.EXPENSES_TYPE_IS_USED:
            notify.error(intl('global.message.expenses_type_is_used'));
            break;
        case ERROR_CODE.IMPORT_NO_DATA:
            notify.error(intl('import.message.no_data'));
            break;
        case ERROR_CODE.IMPORT_DUPLICATE_CODE:
            notify.error(intl('import.message.duplicate_code'));
            break;
        case ERROR_CODE.IMPORT_INVALID_PRODUCT_UNIT_ID:
            notify.error(intl('import.message.invalid_product_unit'));
            break;
        case ERROR_CODE.IMPORT_INVALID_PRODUCT_TYPE_ID:
            notify.error(intl('import.message.invalid_product_type'));
            break;
        case ERROR_CODE.IMPORT_INVALID_PRODUCT_GROUP_ID:
            notify.error(intl('import.message.invalid_product_group'));
            break;
        case ERROR_CODE.IMPORT_INVALID_SUPPLIER_ID:
            notify.error(intl('import.message.invalid_supplier'));
            break;
        case ERROR_CODE.IMPORT_PRODUCTS_FAILED:
            notify.error(intl('import.message.import_products_failed'));
            break;
        case ERROR_CODE.IMPORT_CANNOT_IMPORT_DATA:
            notify.error(intl('import.message.cannot_import_data'));
            break;
        default:
            notify.error(defaultMessage);
            break;
    }
};

export const saveDebtInfoLocalStorage = (
    data: IDebtInfoLocalStorageValue,
    debtDocumentId: string,
    customerName?: string,
    documentNumber?: string,
) => {
    const stringifyData = localStorage.getItem(APP_CONFIG.DEBT_INFO) || '{}';
    const dataParse: IDebtInfoLocalStorage = JSON.parse(stringifyData);
    dataParse[debtDocumentId] = {
        ...data,
        ...(customerName && { customerName }),
        ...(documentNumber && { documentNumber }),
    };
    localStorage.setItem(APP_CONFIG.DEBT_INFO, JSON.stringify(dataParse));
};

export const getDebtInfoLocalStorage = (debtDocumentId: string) => {
    const stringifyData = localStorage.getItem(APP_CONFIG.DEBT_INFO) || '{}';
    const dataParse: IDebtInfoLocalStorage = JSON.parse(stringifyData);
    return dataParse[debtDocumentId];
};

export const updateDebtLocalStorage = (debtDocumentId: string, newAmount: number) => {
    const stringifyData = localStorage.getItem(APP_CONFIG.DEBT_INFO) || '{}';
    const dataParse: IDebtInfoLocalStorage = JSON.parse(stringifyData);

    const currentDebt = dataParse[debtDocumentId];
    if (!currentDebt) return;
    const newPaidAmount = (currentDebt.paidAmount ?? 0) + newAmount;
    const updatedDebt: IDebtInfoLocalStorageValue = {
        ...currentDebt,
        paidAmount: newPaidAmount,
        remainingAmount: (currentDebt.totalAmount ?? 0) - newPaidAmount,
    };

    dataParse[debtDocumentId] = updatedDebt;
    localStorage.setItem(APP_CONFIG.DEBT_INFO, JSON.stringify(dataParse));
    window.dispatchEvent(new Event('localDebtChange'));
};

export const renderLabelOption = (value: number | string, options: DefaultOptionType[]) => {
    const current = options.find(item => item.value === value);
    return current?.label || '';
};

type Attribute = {
    attributeName: string;
    attributeValue: string;
};

export const convertAttributes = (arr: Attribute[]) => {
    if (!arr || arr.length === 0) return;
    const obj = arr.reduce(
        (acc, curr) => {
            acc[curr.attributeName] = curr.attributeValue;
            return acc;
        },
        {} as Record<string, string>,
    );

    return JSON.stringify(obj);
};

export const parseAttributes = (jsonStr: string): Attribute[] => {
    if (!jsonStr) return [];

    try {
        const obj = JSON.parse(jsonStr) as Record<string, string>;
        return Object.entries(obj).map(([key, value]) => ({
            attributeName: key,
            attributeValue: value,
        }));
    } catch (e) {
        console.error('Invalid JSON:', e);
        return [];
    }
};

export const convertedDateProps: any = {
    getValueProps: (value?: string | null) => {
        if (!value) return;
        return { value: moment.utc(value).local() };
    },
};

export const isAdmin = (user?: { roles?: { code: string }[] }) => {
    if (!user?.roles?.length) return false;

    return user.roles.some(role => role.code === DefaultRoles.SUPER_ADMIN || role.code === DefaultRoles.ADMIN);
};
