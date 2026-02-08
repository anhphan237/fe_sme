export const PRODUCT_STATUS = {
    INACTIVE: 0, // Ngừng kinh doanh
    ACTIVE: 1, // Đang kinh doanh
} as const;
export type PRODUCT_STATUS = (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];
