/** user's device */
enum DeviceList {
    /** telephone */
    MOBILE = 'MOBILE',
    /** computer */
    DESKTOP = 'DESKTOP',
}

export type Device = keyof typeof DeviceList;

export type MenuCategory = 'HRM' | 'ERP' | 'CRM' | 'SYSTEM';

export interface MenuItem {
    code: string;
    label: string;
    icon?: string;
    path: string;
    children?: MenuItem[];
    category?: MenuCategory;
    roles?: string | string[]; // Support both 'all' string and array of roles
}

export type MenuChild = Omit<MenuItem, 'children'>;

export type MenuList = MenuItem[];
