import { apiLogout } from '@/api/user.api';
import { AppRouters } from '@/constants';
import { useDispatch } from 'react-redux';

import { setUser } from '@/stores/user.store';

const useLogout = () => {
    const dispatch = useDispatch();

    const handleLogout = async () => {
        try {
            await apiLogout();
            dispatch(
                setUser({
                    logged: false,
                }),
            );
            localStorage.clear();
            window.location.href = AppRouters.HOME;
        } catch {}
    };

    return { handleLogout };
};

export default useLogout;
