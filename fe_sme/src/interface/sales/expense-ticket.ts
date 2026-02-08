import { EXPENSE_TICKET_STATUS } from '@/constants/sales/expense-ticket';
import { QUOTATION_TARGET_STATUS } from '@/constants/sales/quotation';

export interface ExpenseTicketAttachment {
    id: string;
    expenseTicketIssueId: string;
    name: string;
    description: string;
    extension: string;
    path: string;
    created: string;
    lastModified: any;

    // only for form
    status?: 'done' | 'uploading' | 'error'; // Status of the attachment upload
}

export interface ExpenseTicketForm {
    documentDate: string;
    ticketType: number;
    note: string;
    requester: ExpenseRequester;
    approver: ExpenseApprover;
    details: ContactDetails[];
    approvalDate?: string;
    status: QUOTATION_TARGET_STATUS;
    attachments: ExpenseTicketAttachment[];
}

export interface ExpenseRequester {
    userId: string;
    usercode: string;
    username: string;
    userphone: string;
    userposition: string;
}

export interface ExpenseApprover {
    userId: string;
    usercode: string;
    username: string;
    userphone: string;
    userposition: string;
}

export interface ContactDetails {
    contractId: string;
    expenseTypeId: string;
    departureDate: string;
    returnDate: string;
    businessLocation: string;
    businessPurpose: string;
    cost: number;
    note: string;

    invoice?: string;
}

// for list
export interface ExpenseTicketItem {
    requester: Requester;
    approver: Approver;
    details: Detail[];
    id: string;
    invoice: any;
    invoiceDate: string;
    deliveryDate: string;
    receiptDate: string;
    totalQuantity: number;
    totalWeight: number;
    discountAmount: number;
    advancedAmount: number;
    deliveryFee: number;
    totalAmount: number;
    status: EXPENSE_TICKET_STATUS;
    description: any;
    suggestPrice: any;
    suggestDeliveryFee: any;
    created: string;
    createdBy: string;
    createdByName: any;
    lastModified: any;
    lastModifiedBy: any;
    lastModifiedByName: any;
}

export interface Requester {
    id: string;
    expenseTicketId: string;
    userId: string;
    userCode: string;
    userName: string;
    userPhone: string;
    userPosition: string;
    userDepartment: string;
}

export interface Approver {
    id: string;
    expenseTicketId: string;
    approvalDate: any;
    userId: string;
    userCode: string;
    userName: string;
    userPhone: string;
    userPosition: string;
    userDepartment: string;
}

export interface Detail {
    expenseTicketId: string;
    contractId: string;
    expenseTypeId: string;
    expenseTypeName: any;
    departureDate: string;
    returnDate: string;
    businessLocation: string;
    businessPurpose: string;
    cost: number;
    note: string;
    created: string;
    lastModified: any;
}
