import { MenuList } from '@/interface/layout';

type Role = string | string[];

export const filterMenuByRoles = (menus: MenuList, userRoles: string[]): MenuList => {
    const result: MenuList = [];

    for (const menu of menus) {
        const hasPermissionByRoles = hasPermission(menu.roles, userRoles);

        let children: MenuList = [];
        if (menu.children && menu.children.length > 0) {
            children = filterMenuByRoles(menu.children, userRoles);
        }

        if (hasPermissionByRoles || children.length > 0) {
            result.push({ ...menu, ...(children.length > 0 ? { children } : {}) });
        }
    }

    return result;
};

export const hasPermission = (currentRole: Role | undefined, permissions: string[], checkFullPermission = false): boolean => {
    if (!permissions || !currentRole) {
        return false;
    } else if (currentRole === 'all') {
        return true;
    }

    const roles = Array.isArray(currentRole) ? currentRole : [currentRole];

    for (const perm of permissions) {
        const [role, action = ''] = perm.split('.');

        if (roles.includes(role)) {
            if (action === 'f' || (action === 'v' && !checkFullPermission)) {
                return true;
            } else {
                return false;
            }
        }
    }

    return false;
};
