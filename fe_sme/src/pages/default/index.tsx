import { useAppSelector } from '@/stores';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
    const navigate = useNavigate();
    const { menuList } = useAppSelector(state => state.user);

    useEffect(() => {
        if (window.location.pathname === '/' && menuList?.length) {
            navigate(menuList[0].path);
        }
    }, [menuList, window.location.pathname]);

    return <></>;
};

export default Index;
