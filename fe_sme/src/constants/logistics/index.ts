export enum ENTER_WAREHOUSE_STATUS {
    Rejected,
    Approved,
}

export const GOODS_RECEIPT_ISSUE_TYPE = {
    GOODS_RECEIPT: 0,
    GOODS_ISSUE: 1,
} as const;
export type GOODS_RECEIPT_ISSUE_TYPE = typeof GOODS_RECEIPT_ISSUE_TYPE[keyof typeof GOODS_RECEIPT_ISSUE_TYPE];