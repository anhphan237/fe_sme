/**
 * Gateway Operation Types
 * These constants map to the backend Gateway operations
 */

export const GATEWAY_OPERATIONS = {
    // ========== Identity - Authentication ==========
    AUTH_LOGIN: 'com.sme.identity.auth.login',
    AUTH_REGISTER: 'com.sme.identity.auth.register',
    AUTH_CHECK_EMAIL: 'com.sme.identity.auth.checkEmailExists',

    // ========== Identity - User Management ==========
    USER_LIST: 'com.sme.identity.user.list',
    USER_GET: 'com.sme.identity.user.get',
    USER_CREATE: 'com.sme.identity.user.create',
    USER_UPDATE: 'com.sme.identity.user.update',
    USER_DISABLE: 'com.sme.identity.user.disable',

    // ========== Identity - Role Management ==========
    ROLE_ASSIGN: 'com.sme.identity.role.assign',
    ROLE_REVOKE: 'com.sme.identity.role.revoke',

    // ========== Company Management ==========
    COMPANY_CREATE: 'com.sme.company.create',
    COMPANY_REGISTER: 'com.sme.company.register',
    COMPANY_SETUP: 'com.sme.onboarding.company.setup',

    // ========== Department Management ==========
    DEPARTMENT_LIST: 'com.sme.company.department.list',
    DEPARTMENT_CREATE: 'com.sme.company.department.create',
    DEPARTMENT_UPDATE: 'com.sme.company.department.update',
    ORG_DEPARTMENT_CREATE: 'com.sme.org.department.create',
    ORG_DEPARTMENT_UPDATE: 'com.sme.org.department.update',

    // ========== Onboarding - Templates ==========
    TEMPLATE_LIST: 'com.sme.onboarding.template.list',
    TEMPLATE_GET: 'com.sme.onboarding.template.get',
    TEMPLATE_CREATE: 'com.sme.onboarding.template.create',
    TEMPLATE_UPDATE: 'com.sme.onboarding.template.update',

    // ========== Onboarding - Instances ==========
    ONBOARDING_LIST: 'com.sme.onboarding.instance.list',
    ONBOARDING_GET: 'com.sme.onboarding.instance.get',
    ONBOARDING_CREATE: 'com.sme.onboarding.instance.create',
    ONBOARDING_ACTIVATE: 'com.sme.onboarding.instance.activate',
    ONBOARDING_COMPLETE: 'com.sme.onboarding.instance.complete',
    ONBOARDING_CANCEL: 'com.sme.onboarding.instance.cancel',

    // ========== Onboarding - Tasks ==========
    TASK_LIST_BY_ONBOARDING: 'com.sme.onboarding.task.listByOnboarding',
    TASK_GENERATE: 'com.sme.onboarding.task.generate',
    TASK_ASSIGN: 'com.sme.onboarding.task.assign',
    TASK_UPDATE_STATUS: 'com.sme.onboarding.task.updateStatus',

    // ========== Content/Document Management ==========
    DOCUMENT_LIST: 'com.sme.content.document.list',
    DOCUMENT_UPLOAD: 'com.sme.content.document.upload',
    DOCUMENT_ACKNOWLEDGE: 'com.sme.content.document.acknowledge',

    // ========== Notifications ==========
    NOTIFICATION_LIST: 'com.sme.notification.list',
    NOTIFICATION_MARK_READ: 'com.sme.notification.markRead',

    // ========== Survey - Templates ==========
    SURVEY_TEMPLATE_LIST: 'com.sme.survey.template.list',
    SURVEY_TEMPLATE_GET: 'com.sme.survey.template.get',
    SURVEY_TEMPLATE_CREATE: 'com.sme.survey.template.create',
    SURVEY_TEMPLATE_UPDATE: 'com.sme.survey.template.update',
    SURVEY_TEMPLATE_ARCHIVE: 'com.sme.survey.template.archive',

    // ========== Survey - Questions ==========
    SURVEY_QUESTION_CREATE: 'com.sme.survey.question.create',
    SURVEY_QUESTION_LIST_BY_TEMPLATE: 'com.sme.survey.question.list.bytemplate',

    // ========== Survey - Instances ==========
    SURVEY_INSTANCE_SCHEDULE: 'com.sme.survey.instance.schedule',
    SURVEY_INSTANCE_LIST: 'com.sme.survey.instance.list',
    SURVEY_INSTANCE_SEND: 'com.sme.survey.instance.send',

    // ========== Survey - Responses ==========
    SURVEY_RESPONSE_SUBMIT: 'com.sme.survey.response.submit',
    SURVEY_RESPONSE_LIST: 'com.sme.survey.response.list',
    SURVEY_REPORT_SATISFACTION: 'com.sme.survey.report.satisfaction',

    // ========== Analytics ==========
    ANALYTICS_ONBOARDING_SUMMARY: 'com.sme.analytics.company.onboarding.summary',
    ANALYTICS_ONBOARDING_FUNNEL: 'com.sme.analytics.company.onboarding.funnel',
    ANALYTICS_ONBOARDING_BY_DEPT: 'com.sme.analytics.company.onboarding.byDepartment',
    ANALYTICS_TASK_COMPLETION: 'com.sme.analytics.company.task.completion',
    ANALYTICS_SUBSCRIPTION_METRICS: 'com.sme.analytics.platform.subscription.metrics',

    // ========== Billing - Subscription ==========
    BILLING_SUBSCRIPTION_CREATE: 'com.sme.billing.subscription.create',
    BILLING_SUBSCRIPTION_UPDATE: 'com.sme.billing.subscription.update',
    BILLING_SUBSCRIPTION_GET_CURRENT: 'com.sme.billing.subscription.getCurrent',

    // ========== Billing - Usage ==========
    BILLING_USAGE_TRACK: 'com.sme.billing.usage.track',
    BILLING_USAGE_CHECK: 'com.sme.billing.usage.check',
    BILLING_USAGE_SUMMARY: 'com.sme.billing.usage.summary',

    // ========== Billing - Invoices ==========
    BILLING_INVOICE_GENERATE: 'com.sme.billing.invoice.generate',
    BILLING_INVOICE_LIST: 'com.sme.billing.invoice.list',
    BILLING_INVOICE_GET: 'com.sme.billing.invoice.get',

    // ========== Billing - Plans ==========
    BILLING_PLAN_GET: 'com.sme.billing.plan.get',
    BILLING_PLAN_LIST: 'com.sme.billing.plan.list',

    // ========== Billing - Payments ==========
    BILLING_PAYMENT_CREATE_INTENT: 'com.sme.billing.payment.createIntent',
    BILLING_DUNNING_RETRY: 'com.sme.billing.dunning.retry',

    // ========== AI Assistant ==========
    AI_ASSISTANT_ASK: 'com.sme.ai.assistant.ask',

    // ========== Email Automation ==========
    AUTOMATION_EMAIL_SEND: 'com.sme.automation.email.send',
} as const;

export type GatewayOperationType = (typeof GATEWAY_OPERATIONS)[keyof typeof GATEWAY_OPERATIONS];

// Error codes returned by Gateway
export const GATEWAY_ERROR_CODES = {
    SUCCESS: 'SUCCESS',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    BUSINESS_ERROR: 'BUSINESS_ERROR',
    SERVER_ERROR: 'SERVER_ERROR',
} as const;

export type GatewayErrorCode = (typeof GATEWAY_ERROR_CODES)[keyof typeof GATEWAY_ERROR_CODES];
