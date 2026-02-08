import { apiDeleteEmployee, apiSearchEmployee } from '@/api/employee.api';
import { AppRouters } from '@/constants';
import { useLocale } from '@/i18n';
import { DeleteOutlined, EditOutlined, FileAddOutlined, FilterOutlined, SettingOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Avatar, Button, Popconfirm, Tag, Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import BaseButton from '@/components/button';
import Search from '@/components/search';
import EmployeeTable from '@/components/table';
import { notify } from '@/components/toast-message';

import { formatDateTime } from '@/utils/format-datetime';
import { handleCommonError } from '@/utils/helpers';

import { IEmployeeData } from '@/interface/employee';

import StatsCards from './components/StatsCards';
import WorkingChart from './components/WorkingChart';
import { mockDepartmentChartData, mockEmployees, mockGenderChartData, mockPositionChartData, mockStats } from './mockData';
import { EmployeeFilter, EmployeeStatus, Gender, IEmployee } from './types';

const { Column } = EmployeeTable;

const EmployeePage = () => {
    const { t } = useLocale();
    const navigate = useNavigate();

    const [filter, setFilter] = useState<EmployeeFilter>({
        pageNumber: 1,
        pageSize: 10,
        search: undefined,
    });

    const [stats] = useState(mockStats);

    const { data, refetch, isLoading } = useQuery({
        queryKey: ['getListEmployee', filter],
        queryFn: async () => {
            const res = await apiSearchEmployee(filter);
            return res;
        },
    });

    const handleDelete = async (id: string) => {
        try {
            const res = await apiDeleteEmployee(id);
            if (res.succeeded) {
                notify.success(t('message.delete_success'));
                refetch();
            } else throw res;
        } catch (error) {
            handleCommonError(error, t);
        }
    };

    const renderGender = (gender: number) => {
        const genderMap: Record<number, { label: string; color: string }> = {
            0: {
                label: t('employee.gender.female'),
                color: 'pink',
            },
            1: {
                label: t('employee.gender.male'),
                color: 'blue',
            },
        };
        const config = genderMap[gender] || genderMap[3];
        return <Tag color={config.color}>{config.label}</Tag>;
    };

    const renderStatus = (status: number) => {
        const statusMap: Record<number, { label: string; color: string }> = {
            0: {
                label: t('employee.status.probation'),
                color: 'orange',
            },
            1: {
                label: t('employee.status.official'),
                color: 'green',
            },
            2: {
                label: t('employee.status.resigned'),
                color: 'red',
            },
            3: {
                label: t('employee.status.retired'),
                color: 'gray',
            },
            4: {
                label: t('employee.status.terminated'),
                color: 'red',
            },
            5: {
                label: t('employee.status.maternity_leave'),
                color: 'purple',
            },
        };
        const config = statusMap[status] || { label: t('employee.gender.other'), color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
    };

    const renderEmployee = (record: IEmployeeData) => {
        return (
            <div className="flex items-center gap-3">
                <Avatar size={40} style={{ backgroundColor: '#f06292' }}>
                    {record.fullName.charAt(0).toUpperCase()}
                </Avatar>
                <div>
                    <div
                        className="font-medium text-blue-600 cursor-pointer hover:underline"
                        onClick={() => navigate(`${AppRouters.EMPLOYEES}/${record.id}`)}
                    >
                        {record.fullName}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col p-4 ">
            <div className="flex gap-4 mb-4">
                <div className="flex-1 h-full">
                    <StatsCards stats={stats} loading={isLoading} />
                </div>
            </div>

            <div className="flex justify-between mb-2 mx-2 gap-2">
                <div>
                    <BaseButton onClick={() => navigate(`${AppRouters.EMPLOYEES}/add`)} icon={<FileAddOutlined />} label={t('Add new')} />
                </div>

                <div className="flex items-center gap-2">
                    <Search
                        placeholder={t('global.search_table')}
                        allowClear
                        className="w-96"
                        onSearch={value => {
                            setFilter({ ...filter, search: value, pageNumber: 1 });
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

            <EmployeeTable<IEmployeeData>
                dataSource={data?.data || []}
                rowKey="id"
                wrapClassName="!h-full w-full"
                loading={isLoading}
                pagination={{
                    current: filter.pageNumber,
                    pageSize: filter.pageSize,
                    total: data?.totalItems,
                    onChange: (page, pageSize) => {
                        setFilter({ ...filter, pageNumber: page, pageSize });
                    },
                }}
            >
                <Column
                    title={<div className="flex items-center justify-center">{t('category.list.index')}</div>}
                    dataIndex="index"
                    key="index"
                    onCell={() => ({ width: 50 })}
                    onHeaderCell={() => ({ style: { width: 50, minWidth: 50 } })}
                    render={(_, __, index: number) => (
                        <div className="flex items-center justify-center mb-0">{(filter.pageNumber - 1) * filter.pageSize + (index + 1)}</div>
                    )}
                />
                <Column title={t('employee.code')} dataIndex="code" key="code" width={120} />

                <Column title={t('employee.full_name')} key="fullName" width={250} render={(_, record: IEmployeeData) => renderEmployee(record)} />

                <Column title={t('employee.gender')} dataIndex="gender" key="gender" width={90} render={(gender: number) => renderGender(gender)} />

                <Column
                    title={t('employee.date_of_birth')}
                    dataIndex="dateOfBirth"
                    key="dateOfBirth"
                    width={120}
                    render={value => formatDateTime(value, 'DD-MM-YYYY')}
                />

                <Column
                    title={t('employee.mobile_phone')}
                    key="mobilePhone"
                    width={140}
                    render={(_, record: IEmployeeData) => record.mobilePhone || '-'}
                />

                <Column title={t('employee.work_email')} dataIndex="workEmail" key="workEmail" width={220} />

                <Column title={t('employee.position')} key="position" width={180} render={() => '-'} />

                <Column title={t('employee.department')} key="department" width={180} render={() => '-'} />

                <Column
                    title={t('employee.status')}
                    dataIndex="status"
                    key="status"
                    align="center"
                    width={130}
                    render={(status: number) => renderStatus(status)}
                />

                <Column
                    key="action"
                    width={70}
                    fixed="right"
                    render={(_, record: IEmployeeData) => (
                        <div className="flex gap-1">
                            <Popconfirm
                                title={t('employee.action.delete_confirm')}
                                description={t('employee.action.delete_confirm_message', { name: record.fullName })}
                                onConfirm={() => handleDelete(record.id)}
                                okText={t('employee.action.delete')}
                                cancelText={t('global.popup.cancel.text')}
                            >
                                <Tooltip title={t('employee.action.delete')}>
                                    <Button type="text" danger icon={<DeleteOutlined />} />
                                </Tooltip>
                            </Popconfirm>
                        </div>
                    )}
                />
            </EmployeeTable>
        </div>
    );
};

export default EmployeePage;
