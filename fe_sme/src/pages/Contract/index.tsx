import { AppRouters } from '@/constants';
import { useLocale } from '@/i18n';
import { DeleteOutlined, FileAddOutlined, FilterOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Popconfirm, Tooltip } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

import BaseButton from '@/components/button';
import Search from '@/components/search';
import MyTable from '@/components/table';

interface IContractData {
    id: number;
    contractCode: string;
    employeeCode: string;
    contractName: string;
    customerName: string;
    phone: string;
    startDate: string;
    endDate: string;
    status: string;
    createdBy: string;
}

const ContractPage = () => {
    const { t } = useLocale();
    const navigate = useNavigate();

    const data: { data: IContractData[]; totalItems: number } = {
        data: Array.from({ length: 20 }).map((_, i) => ({
            id: i + 1,
            contractCode: `HD${1000 + i}`,
            employeeCode: `EMP${1000 + i}`,
            contractName: `Hợp đồng dịch vụ số ${i + 1}`,
            customerName: `Nhân sự ${i + 1}`,
            phone: `09${Math.floor(10000000 + Math.random() * 89999999)}`,
            startDate: `2025/0${(i % 9) + 1}/01`,
            endDate: `2025/0${(i % 9) + 1}/28`,
            status: i % 2 === 0 ? 'Đang hiệu lực' : 'Đã hết hạn',
            createdBy: `Nhân viên ${i + 2}`,
        })),
        totalItems: 90,
    };

    const [filter, setFilter] = useState({ pageNumber: 1, pageSize: 10 });

    const handleDelete = (id: number) => {
        console.log('Delete contract id:', id);
    };

    const renderStatus = (status: string) => {
        const color = status === 'Đang hiệu lực' ? 'text-green-600' : 'text-red-500';
        return <div className={`font-semibold ${color}`}>{status}</div>;
    };

    return (
        <div className="h-full flex flex-col mx-2">
            <div className="flex justify-between mb-2 mx-2 gap-2">
                <div>
                    <BaseButton onClick={() => navigate(`${AppRouters.CONTRACT}/add`)} icon={<FileAddOutlined />} label={t('Add new')} />
                </div>
                <div className="flex items-center gap-2">
                    <Search
                        placeholder={t('global.search_table')}
                        allowClear
                        className="w-96"
                        onSearch={value => {
                            console.log(value);
                        }}
                    />
                    <Tooltip title={t('menu.filter')}>
                        <Button icon={<FilterOutlined />} />
                    </Tooltip>
                    <Tooltip title={t('menu.configuration')}>
                        <Button icon={<SettingOutlined />} />
                    </Tooltip>
                </div>
            </div>
            <MyTable<IContractData>
                dataSource={data.data}
                rowKey="id"
                wrapClassName="!h-full w-full"
                pagination={{
                    current: filter.pageNumber,
                    pageSize: filter.pageSize,
                    total: data.totalItems,
                    onChange: (page, pageSize) => {
                        setFilter({ ...filter, pageNumber: page, pageSize });
                    },
                }}
            >
                <MyTable.Column
                    title={<div className="flex items-center justify-center">{'STT'}</div>}
                    dataIndex="index"
                    key="index"
                    onCell={() => ({ width: 50 })}
                    onHeaderCell={() => ({ style: { width: 50, minWidth: 50 } })}
                    render={(_, __, index: number) => (
                        <div className="flex items-center justify-center mb-0">{(filter.pageNumber - 1) * filter.pageSize + (index + 1)}</div>
                    )}
                />

                <MyTable.Column
                    title="Mã hợp đồng"
                    dataIndex="contractCode"
                    key="contractCode"
                    width={120}
                    render={(_, record: IContractData) => (
                        <Link to={`${AppRouters.CONTRACT}/${record.contractCode}`} className="text-colorPrimary font-medium whitespace-nowrap">
                            {record.contractCode}
                        </Link>
                    )}
                />

                <MyTable.Column title="Loại hợp đồng" dataIndex="contractName" key="contractName" width={250} />

                <MyTable.Column title="Nhân sự" dataIndex="customerName" key="customerName" width={180} />

                <MyTable.Column
                    title="Nhân viên"
                    key="employeeCode"
                    width={200}
                    render={(_, record: IContractData) => (
                        <div className="flex flex-col">
                            <div className="font-medium">Nguyễn Văn A</div>
                            <div className="opacity-80">{record.employeeCode}</div>
                        </div>
                    )}
                />

                <MyTable.Column title="Số điện thoại" dataIndex="phone" key="phone" width={140} />

                <MyTable.Column
                    title="Ngày bắt đầu - kết thúc"
                    key="startDate"
                    width={220}
                    render={(_, record: IContractData) => (
                        <div className="text-colorPrimary font-medium whitespace-nowrap">
                            {record.startDate} - {record.endDate}
                        </div>
                    )}
                />

                <MyTable.Column title="Trạng thái" dataIndex="status" key="status" align="center" width={130} render={renderStatus} />

                <MyTable.Column
                    key="action"
                    width={70}
                    fixed="right"
                    render={(_, record: IContractData) => (
                        <div className="flex gap-1 justify-center">
                            <Popconfirm
                                title="Xác nhận xóa hợp đồng"
                                description={`Bạn có chắc muốn xóa ${record.contractName}?`}
                                onConfirm={() => handleDelete(record.id)}
                                okText="Xóa"
                                cancelText="Hủy"
                            >
                                <Tooltip title="Xóa">
                                    <Button type="text" danger icon={<DeleteOutlined />} />
                                </Tooltip>
                            </Popconfirm>
                        </div>
                    )}
                />
            </MyTable>
        </div>
    );
};

export default ContractPage;
