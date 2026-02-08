import { FormattedMessage } from 'react-intl';

export const QUOTATION_CALCULATION_TYPE = {
    BY_ITEM: 0,
    BY_ACTUAL_WEIGHT: 1,
    BY_THEORETICAL_WEIGHT: 2,
} as const;
export type QUOTATION_CALCULATION_TYPE = (typeof QUOTATION_CALCULATION_TYPE)[keyof typeof QUOTATION_CALCULATION_TYPE];

export const QUOTATION_CALCULATION_TYPE_OPTIONS = [
    {
        labelTxt: 'sales.quotation.by_item',
        label: <FormattedMessage id="sales.quotation.by_item" />,
        value: QUOTATION_CALCULATION_TYPE.BY_ITEM,
    },
    {
        labelTxt: 'sales.quotation.by_actual_weight',
        label: <FormattedMessage id="sales.quotation.by_actual_weight" />,
        value: QUOTATION_CALCULATION_TYPE.BY_ACTUAL_WEIGHT,
    },
    {
        labelTxt: 'sales.quotation.by_theoretical_weight',
        label: <FormattedMessage id="sales.quotation.by_theoretical_weight" />,
        value: QUOTATION_CALCULATION_TYPE.BY_THEORETICAL_WEIGHT,
    },
];

export const QUOTATION_TARGET_STATUS = {
    DRAFT: 0,
    REQUEST: 1,
    REJECTED: 2,
    APPROVED: 3,
    CANCELLED: 4,
    DONE: 5,
    INPROGRESS: 6,
} as const;
export type QUOTATION_TARGET_STATUS = (typeof QUOTATION_TARGET_STATUS)[keyof typeof QUOTATION_TARGET_STATUS];
