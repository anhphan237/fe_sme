import { apiSearchPayrollCycle } from '@/api/finance.api';
import { useLocale } from '@/i18n';
import { FilterOutlined, SettingOutlined } from '@ant-design/icons';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useQuery } from '@tanstack/react-query';
import { Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import BaseButton from '@/components/button';
import Search from '@/components/search';
import MyTable from '@/components/table';

import MoneyItem from './components/MoneyItem';

interface IPayrollItem {
    id: string;
    employeeCode: string;
    employeeName: string;
    department: string;
    position: string;
    month: string;
    workingDays: number;
    otHours: number;
    baseSalary: number;
    totalAllowance: number;
    totalDeduction: number;
    totalSalary: number;
}

export default function PayrollPage() {
    const { t } = useLocale();
    const navigate = useNavigate();

    const [filter, setFilter] = useState({
        pageNumber: 1,
        pageSize: 10,
        filters: [
            {
                key: 'year',
                value: [2025],
            },
        ],
    });

    // const { data } = useQuery({
    //     queryKey: ['getListPayrollCycle', filter],
    //     queryFn: async () => {
    //         const cleanFilter = { ...filter };
    //         // if (!cleanFilter.range?.from || !cleanFilter.range?.to) {
    //         //     delete cleanFilter.range;
    //         // }
    //         const res = await apiSearchPayrollCycle(cleanFilter);
    //         return res;
    //     },
    // });

    // console.log(data);

    return (
        <div className="h-full flex flex-col mx-2">
            <div className="flex justify-between items-end mb-2 mx-2">
                <div className="flex items-center gap-2">
                    <MoneyItem money={9999999} title="Phát sinh" />
                    <MoneyItem money={9999999} title="Đã thanh toán" />
                    <MoneyItem money={9999999} isPrimary title="Còn nợ" />
                </div>
                <div className="flex gap-2">
                    <Search placeholder={t('global.search_table')} allowClear className="w-96" />
                    <Tooltip title={t('menu.filter')}>
                        <BaseButton icon={<FilterOutlined />} className="!w-fit px-2" />
                    </Tooltip>
                    <Tooltip title={t('menu.configuration')}>
                        <BaseButton icon={<SettingOutlined />} className="!w-fit px-2" />
                    </Tooltip>
                </div>
            </div>

            <MyTable<IPayrollItem>
                dataSource={[]}
                rowKey="id"
                pagination={{
                    current: filter.pageNumber,
                    pageSize: filter.pageSize,
                    total: 99,
                    onChange: (page, pageSize) => {
                        setFilter({ ...filter, pageNumber: page, pageSize });
                    },
                }}
            >
                <MyTable.Column
                    title={<div className="text-center">STT</div>}
                    render={(_, __, index) => <div className="text-center">{(filter.pageNumber - 1) * filter.pageSize + index + 1}</div>}
                    onCell={() => ({ width: 60 })}
                />

                <MyTable.Column width={180} title="Mã NV" dataIndex="employeeCode" render={v => <div className="font-medium">{v}</div>} />

                <MyTable.Column width={200} title="Tên nhân viên" dataIndex="employeeName" render={v => <div className="font-medium">{v}</div>} />

                <MyTable.Column width={180} title="Phòng ban" dataIndex="department" className="font-medium" />

                <MyTable.Column width={180} title="Chức vụ" dataIndex="position" className="font-medium" />

                <MyTable.Column width={160} title="Ngày công" dataIndex="workingDays" render={v => <div className="font-medium">{v}</div>} />

                <MyTable.Column width={120} title="Giờ OT" dataIndex="otHours" render={v => <div className="font-medium">{v}</div>} />

                <MyTable.Column
                    width={180}
                    title="Lương cơ bản"
                    dataIndex="baseSalary"
                    render={v => <div className="font-medium">{v.toLocaleString()} đ</div>}
                />

                <MyTable.Column
                    width={180}
                    title="Phụ cấp"
                    dataIndex="totalAllowance"
                    render={v => <div className="font-medium">{v.toLocaleString()} đ</div>}
                />

                <MyTable.Column
                    width={180}
                    title="Khấu trừ"
                    dataIndex="totalDeduction"
                    render={v => <div className="font-medium">-{v.toLocaleString()} đ</div>}
                />

                <MyTable.Column
                    width={220}
                    title="Lương thực nhận"
                    fixed="right"
                    dataIndex="totalSalary"
                    render={v => <div className="font-semibold text-green-700">{v.toLocaleString()} đ</div>}
                />

                <MyTable.Column
                    key="action"
                    width={100}
                    fixed="right"
                    render={(_, record) => (
                        <div className="flex">
                            <BaseButton
                                type="text"
                                className="w-fit !px-2 !py-0"
                                onClick={() => navigate(`/payroll/${record.id}`)}
                                icon={<FontAwesomeIcon icon={faEye} />}
                                title={t('payroll.icon.detail')}
                            />
                        </div>
                    )}
                />
            </MyTable>
        </div>
    );
}
