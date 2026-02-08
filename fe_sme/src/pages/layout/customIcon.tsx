import {
    CarOutlined,
    ClockCircleOutlined,
    DashboardOutlined,
    DollarOutlined,
    HomeOutlined,
    LineChartOutlined,
    MoneyCollectOutlined,
    ProfileOutlined,
    ShopOutlined,
    ShoppingOutlined,
    SolutionOutlined,
    TeamOutlined,
} from '@ant-design/icons';
import type { FC } from 'react';

interface CustomIconProps {
    type: string;
}

export const CustomIcon: FC<CustomIconProps> = props => {
    const { type } = props;
    let com = <></>;

    if (type === 'employees') {
        com = <TeamOutlined />;
    } else if (type === 'dashboard') {
        com = <DashboardOutlined />;
    } else if (type === 'contract') com = <SolutionOutlined />;
    else if (type === 'attendance') com = <ClockCircleOutlined />;
    else if (type === 'payroll') com = <MoneyCollectOutlined />;
    else if (type === 'finance-accounting') com = <LineChartOutlined />;
    else if (type === 'user') com = <SolutionOutlined />;
    else if (type === 'logistics') com = <CarOutlined />;
    else if (type === 'category') com = <HomeOutlined />;
    else if (type === 'sale-management') com = <DollarOutlined />;
    else if (type === 'purchase-management') com = <ShoppingOutlined />;
    else if (type === 'customer') com = <ProfileOutlined />;
    else if (type === 'supplier') com = <ShopOutlined />;

    return <span className="anticon flex items-center justify-center">{com}</span>;
};
