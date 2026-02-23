export enum AppRouters {
    // HOME
    HOME = '/',

    // AUTH
    LOGIN = '/login',
    REGISTER = '/register',

    // ONBOARDING SETUP
    ORG_SETUP = '/setup/organization',
    PLAN_SELECTION = '/setup/plan',

    // ERRORS
    NO_PERMISSION = '/403',
    NOT_FOUND = '/404',

    // SYSTEM
    SYSTEM = '/system',
    USERS = '/system/users',
    TENANT = '/system/tenant',
    PERMISSIONS = '/system/permissions',
    ROLE_GROUP = '/system/role-group',
    EDIT_ROLE_GROUP = '/system/role-group/:id',
    NOTIFICATION_SYSTEM = '/system/notification',

    // DASHBOARDS
    DASHBOARDS = '/dashboards',

    // PROFILE
    PROFILE = '/profile',

    // EMPLOYEES
    EMPLOYEES = '/employees',
    EMPLOYEE_DETAIL = '/employees/:id',
    EMPLOYEE_ADD = '/employees/add',

    // EMPLOYMENT CONTRACTS
    CONTRACT = '/contract',
    ADD_CONTRACT = '/contract/add',
    EDIT_CONTRACT = '/contract/edit/:id',
    DETAIL_CONTRACT = '/contract/:id',

    // CATEGORIES
    CATEGORIES = '/categories',
    DEPARTMENT = '/categories/department',
    DEPARTMENT_ADD = '/categories/department/add',
    DEPARTMENT_EDIT = '/categories/department/:id',
    POSITION = '/categories/position',
    POSITION_ADD = '/categories/position/add',
    POSITION_EDIT = '/categories/position/:id',

    // ONBOARDING
    ONBOARDING = '/onboarding',
    ONBOARDING_TEMPLATES = '/onboarding/templates',
    ONBOARDING_TEMPLATE_ADD = '/onboarding/templates/add',
    ONBOARDING_TEMPLATE_EDIT = '/onboarding/templates/:id/edit',
    ONBOARDING_TEMPLATE_DETAIL = '/onboarding/templates/:id',
    ONBOARDING_INSTANCES = '/onboarding/instances',
    ONBOARDING_INSTANCE_ADD = '/onboarding/instances/add',
    ONBOARDING_INSTANCE_DETAIL = '/onboarding/instances/:id',
    ONBOARDING_TASKS = '/onboarding/tasks',
    ONBOARDING_MY_TASKS = '/onboarding/my-tasks',

    // SURVEYS
    SURVEYS = '/surveys',
    SURVEY_TEMPLATES = '/surveys/templates',
    SURVEY_TEMPLATE_ADD = '/surveys/templates/add',
    SURVEY_TEMPLATE_EDIT = '/surveys/templates/:id/edit',
    SURVEY_TEMPLATE_DETAIL = '/surveys/templates/:id',
    SURVEY_RESPONSES = '/surveys/responses',
    SURVEY_TAKE = '/surveys/take/:id',

    // DOCUMENTS
    DOCUMENTS = '/documents',
    DOCUMENT_UPLOAD = '/documents/upload',
    DOCUMENT_DETAIL = '/documents/:id',

    // ANALYTICS
    ANALYTICS = '/analytics',
    ANALYTICS_ONBOARDING = '/analytics/onboarding',
}
