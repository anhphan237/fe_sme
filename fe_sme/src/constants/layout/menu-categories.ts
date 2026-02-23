export const MENU_CATEGORIES = {
    HRM: {
        code: 'HRM',
        label: 'menu.category.hrm',
        order: 1,
        color: '#1890ff',
        icon: 'team',
        description: 'Human Resource Management & Employee Onboarding',
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
