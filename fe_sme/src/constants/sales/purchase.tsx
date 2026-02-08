import { FormattedMessage } from 'react-intl';

export const PURCHASE_CALCULATION_TYPE = {
    BY_ITEM: 0,
    BY_ACTUAL_WEIGHT: 1,
    BY_THEORETICAL_WEIGHT: 2,
} as const;
export type PURCHASE_CALCULATION_TYPE = (typeof PURCHASE_CALCULATION_TYPE)[keyof typeof PURCHASE_CALCULATION_TYPE];

export const PURCHASE_CALCULATION_TYPE_OPTIONS = [
    {
        labelTxt: 'sales.purchase.by_item',
        label: <FormattedMessage id="sales.purchase.by_item" />,
        value: PURCHASE_CALCULATION_TYPE.BY_ITEM,
    },
    {
        labelTxt: 'sales.purchase.by_actual_weight',
        label: <FormattedMessage id="sales.purchase.by_actual_weight" />,
        value: PURCHASE_CALCULATION_TYPE.BY_ACTUAL_WEIGHT,
    },
    {
        labelTxt: 'sales.purchase.by_theoretical_weight',
        label: <FormattedMessage id="sales.purchase.by_theoretical_weight" />,
        value: PURCHASE_CALCULATION_TYPE.BY_THEORETICAL_WEIGHT,
    },
];

export const PURCHASE_STATUS = {
    DRAFT: 0,
    REQUEST: 1,
    REJECTED: 2,
    APPROVED: 3,
    CANCELLED: 4,
    DONE: 5,
    INPROGRESS: 6,
} as const;
export type PURCHASE_STATUS = (typeof PURCHASE_STATUS)[keyof typeof PURCHASE_STATUS];
