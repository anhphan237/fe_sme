export interface ITopSellingData {
    image?: string;
    productId: string;
    productName: string;
    ranking: number;
    rate: number;
    totalCount: number;
    totalQuantity: number;
}
export interface ITopProductData {
    saleProducts: ITopSellingData[];
    returnProducts: ITopSellingData[];
}

export interface ITopCustomerData {
    customerId: string;
    customerName: string;
    customerCode: string;
    customerPhoneNumber: string;
    customerAddress: string;
    customerTypeName: string;
    totalAmount: number;
    totalCount: number;
    totalPaidAmount: number;
    totalRemainingAmount: number;
    totalRefund: number;
    totalCountRefund: number;
}

export interface ISummarySaleData {
    orderDraft: ISaleData;
    invoice: ISaleData;
    orderReturn: ISaleData;
    paymentSlip: ISaleData;
    orderSuccess: ISaleData;
    debt: ISaleData;
}

export interface ISaleData {
    totalAmount: number;
    totalItem: number;
    totalQuantity: number;
    totalSale: number | null;
}

export class SummarySaleData implements ISummarySaleData {
    orderDraft: ISaleData = {
        totalAmount: 0,
        totalItem: 0,
        totalQuantity: 0,
        totalSale: 0,
    };
    invoice: ISaleData = {
        totalAmount: 0,
        totalItem: 0,
        totalQuantity: 0,
        totalSale: 0,
    };
    orderReturn: ISaleData = {
        totalAmount: 0,
        totalItem: 0,
        totalQuantity: 0,
        totalSale: 0,
    };
    paymentSlip: ISaleData = {
        totalAmount: 0,
        totalItem: 0,
        totalQuantity: 0,
        totalSale: 0,
    };
    orderSuccess: ISaleData = {
        totalAmount: 0,
        totalItem: 0,
        totalQuantity: 0,
        totalSale: 0,
    };
    debt: ISaleData = {
        totalAmount: 0,
        totalItem: 0,
        totalQuantity: 0,
        totalSale: 0,
    };
}

export interface ISummaryOrderData {
    totalOrders: number;
    percent: number;
    returned: IOrderStatusData;
    pending: IOrderStatusData;
    done: IOrderStatusData;
    inProgress: IOrderStatusData;
    cancelled: IOrderStatusData;
}

export interface IOrderStatusData {
    totalOrders: number;
    percent: number;
    status: number[];
}

export class SummaryOrderData implements ISummaryOrderData {
    totalOrders: number = 0;
    percent: number = 0;
    returned: IOrderStatusData = {
        totalOrders: 0,
        percent: 0,
        status: [0],
    };
    pending: IOrderStatusData = {
        totalOrders: 0,
        percent: 0,
        status: [0],
    };
    done: IOrderStatusData = {
        totalOrders: 0,
        percent: 0,
        status: [0],
    };
    inProgress: IOrderStatusData = {
        totalOrders: 0,
        percent: 0,
        status: [0],
    };
    cancelled: IOrderStatusData = {
        totalOrders: 0,
        percent: 0,
        status: [0],
    };
}

export interface IMoneyTrend {
    time: string;
    label: string;
    invoice: number;
    returns: number;
    profits: number;
    sales: number;
    percentInvoice: number;
    percentReturns: number;
    percentSales: number;
}

export interface IInTransitData {
    totalOrders: number;
    percent: number;
    shipping: IOrderStatusData;
    delay: IOrderStatusData;
    shipperDeliverDelay: IOrderStatusData;
    shipperDeliverFailed: IOrderStatusData;
    unDelivery: IOrderStatusData;
    shipped: IOrderStatusData;
}

export class InTransitData implements IInTransitData {
    totalOrders: number = 0;
    percent: number = 0;
    shipping: IOrderStatusData = {
        totalOrders: 0,
        percent: 0,
        status: [0],
    };
    delay: IOrderStatusData = {
        totalOrders: 0,
        percent: 0,
        status: [0],
    };
    shipperDeliverDelay: IOrderStatusData = {
        totalOrders: 0,
        percent: 0,
        status: [0],
    };
    shipperDeliverFailed: IOrderStatusData = {
        totalOrders: 0,
        percent: 0,
        status: [0],
    };
    unDelivery: IOrderStatusData = {
        totalOrders: 0,
        percent: 0,
        status: [0],
    };
    shipped: IOrderStatusData = {
        totalOrders: 0,
        percent: 0,
        status: [0],
    };
}
export interface ITopCustomerDebtData {
    customerId?: string;
    customerName?: string;
    customerCode?: string;
    customerPhoneNumber?: string;
    customerTypeName?: string;
    totalRemainingAmount?: number;
    totalDebtDocument?: number;
}
