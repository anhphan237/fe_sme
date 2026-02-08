export const MENU_CATEGORIES = {
    HRM: {
        code: 'HRM',
        label: 'menu.category.hrm',
        order: 1,
        color: '#1890ff',
        icon: 'team',
        description: 'Human Resource Management',
    },
    ERP: {
        code: 'ERP',
        label: 'menu.category.erp',
        order: 2,
        color: '#52c41a',
        icon: 'shop',
        description: 'Enterprise Resource Planning',
    },
    CRM: {
        code: 'CRM',
        label: 'menu.category.crm',
        order: 3,
        color: '#faad14',
        icon: 'customerService',
        description: 'Customer Relationship Management',
    },
    SYSTEM: {
        code: 'SYSTEM',
        label: 'menu.category.system',
        order: 99,
        color: '#8c8c8c',
        icon: 'setting',
        description: 'System Administration',
    },
} as const;

export type MenuCategoryConfig = (typeof MENU_CATEGORIES)[keyof typeof MENU_CATEGORIES];
