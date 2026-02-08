import { COMMON_STATUS } from '@/core/components/Status/StatusTag';
import { FormattedMessage } from 'react-intl';

export const EXPENSE_PROPOSAL_TYPE = {
    ADVANCE: 0,
    REIMBURSEMENT: 1,
} as const;
export type EXPENSE_PROPOSAL_TYPE = (typeof EXPENSE_PROPOSAL_TYPE)[keyof typeof EXPENSE_PROPOSAL_TYPE];

export const EXPENSE_PROPOSAL_OPTION = [
    {
        label: <FormattedMessage id="expense_ticket.advance" />,
        value: EXPENSE_PROPOSAL_TYPE.ADVANCE,
    },
    {
        label: <FormattedMessage id="expense_ticket.reimbursement" />,
        value: EXPENSE_PROPOSAL_TYPE.REIMBURSEMENT,
    },
];

export const EXPENSE_TICKET_STATUS = COMMON_STATUS;
export type EXPENSE_TICKET_STATUS = (typeof EXPENSE_TICKET_STATUS)[keyof typeof EXPENSE_TICKET_STATUS];