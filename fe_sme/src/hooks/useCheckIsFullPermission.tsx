import { DefaultRoles } from '@/constants';
import { useAppSelector } from '@/stores';
import { useMemo } from 'react';

import { hasPermission } from './usePermission';

const useCheckIsFullPermission = (key: string) => {
    const { roles, permissions } = useAppSelector(state => state.global);

    const isFullPermission = useMemo(() => {
        if (roles?.includes(DefaultRoles.SUPER_ADMIN.toLowerCase())) return true;
        if (!permissions) return false;
        return hasPermission(key, permissions, true);
    }, [permissions, roles]);

    return isFullPermission;
};

export default useCheckIsFullPermission;
