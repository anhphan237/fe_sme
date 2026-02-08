import { apiAutoGenerateAttendance, apiDeleteAttendance, apiSearchAttendances } from '@/api/attendance.api';
import { apiSearchEmployee } from '@/api/employee.api';
import { useLocale } from '@/i18n';
import {
    CalendarOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    DeleteOutlined,
    EditOutlined,
    FileAddOutlined,
    ReloadOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Avatar, Button, DatePicker, Modal, Popconfirm, Select, Space, Statistic, Tag, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';

import BaseButton from '@/components/button';
import Search from '@/components/search';
import AttendanceTable from '@/components/table';
import { notify } from '@/components/toast-message';

import { formatDateTime } from '@/utils/format-datetime';
import { handleCommonError } from '@/utils/helpers';

import { IAddEditAttendance, IAttendanceData } from '@/interface/attendance/attendance';
import { PageFilter } from '@/interface/common';

import ModalAddEditAttendance from './components/ModalAddEditAttendance';

const { Column } = AttendanceTable;
const { RangePicker } = DatePicker;

const AttendancePage = () => {
    const { t } = useLocale();
    const [formData, setFormData] = useState<IAddEditAttendance | null>(null);
    const [filter, setFilter] = useState<PageFilter>({
        pageSize: 10,
        pageNumber: 1,
        search: undefined,
        filters: [
            {
                key: 'Range',
                value: [dayjs().startOf('month').format('YYYY-MM-DD'), dayjs().endOf('month').format('YYYY-MM-DD')],
            },
        ],
    });

    const [selectedMonth, setSelectedMonth] = useState(dayjs());
    const [autoGenerateLoading, setAutoGenerateLoading] = useState(false);

    const { data, refetch, isLoading } = useQuery({
        queryKey: ['getListAttendances', filter],
        queryFn: async () => {
            const res = await apiSearchAttendances(filter);
            return res;
        },
    });

    const { data: employeesData } = useQuery({
        queryKey: ['getListEmployeeForFilter'],
        queryFn: async () => {
            const res = await apiSearchEmployee({ pageNumber: 1, pageSize: 1000 });
            return res;
        },
    });

    const stats = {
        total: data?.data?.length || 0,
        present: data?.data?.filter((a: IAttendanceData) => a.status === 'PRESENT').length || 0,
        absent: data?.data?.filter((a: IAttendanceData) => a.status === 'ABSENT').length || 0,
        late: data?.data?.filter((a: IAttendanceData) => a.status === 'LATE').length || 0,
        leave: data?.data?.filter((a: IAttendanceData) => a.status === 'LEAVE').length || 0,
    };
    const rate = stats.total > 0 ? (((stats.present + stats.late) / stats.total) * 100).toFixed(1) : 0;

    const handleDelete = async (id: string) => {
        try {
            const res = await apiDeleteAttendance(id);
            if (res.succeeded) {
                notify.success(t('message.delete_success'));
                refetch();
            } else throw res;
        } catch (error) {
            handleCommonError(error, t);
        }
    };

    const handleAutoGenerate = () => {
        Modal.confirm({
            title: t('attendance.auto_generate_confirm'),
            content: t('attendance.auto_generate_description', { month: selectedMonth.format('MM/YYYY') }),
            okText: t('global.confirm'),
            cancelText: t('global.cancel'),
            onOk: async () => {
                try {
                    setAutoGenerateLoading(true);
                    const res = await apiAutoGenerateAttendance({
                        month: selectedMonth.startOf('month').format('YYYY-MM-DD'),
                    });
                    if (res.succeeded) {
                        notify.success(t('attendance.auto_generate_success', { count: res.data }));
                        refetch();
                    } else throw res;
                } catch (error) {
                    handleCommonError(error, t);
                } finally {
                    setAutoGenerateLoading(false);
                }
            },
        });
    };

    const handleClose = () => {
        setFormData(null);
        refetch();
    };

    const renderStatus = (status: string) => {
        const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
            PRESENT: { label: t('attendance.status.present'), color: 'green', icon: <CheckCircleOutlined /> },
            ABSENT: { label: t('attendance.status.absent'), color: 'red', icon: <CloseCircleOutlined /> },
            LATE: { label: t('attendance.status.late'), color: 'orange', icon: <ClockCircleOutlined /> },
            LEAVE: { label: t('attendance.status.leave'), color: 'blue', icon: <CalendarOutlined /> },
        };
        const config = statusConfig[status] || statusConfig.PRESENT;
        return (
            <Tag color={config.color} icon={config.icon}>
                {config.label}
            </Tag>
        );
    };

    const handleFilterChange = (key: string, value: any) => {
        const currentFilters = filter.filters || [];
        const otherFilters = currentFilters.filter(f => f.key !== key);

        if (value && value.length > 0) {
            setFilter({
                ...filter,
                filters: [...otherFilters, { key, value }],
                pageNumber: 1,
            });
        } else {
            setFilter({
                ...filter,
                filters: otherFilters.length > 0 ? otherFilters : undefined,
                pageNumber: 1,
            });
        }
    };

    return (
        <div className="h-full flex flex-col p-4">
            {/* Statistics Cards */}
            <div className="grid grid-cols-6 gap-4 mb-4">
                <div className="bg-white p-4 rounded-lg shadow">
                    <Statistic title={t('attendance.stats.total')} value={stats.total} prefix={<FileAddOutlined />} />
                </div>
                <div className="bg-green-50 p-4 rounded-lg shadow">
                    <Statistic
                        title={t('attendance.stats.present')}
                        value={stats.present}
                        valueStyle={{ color: '#3f8600' }}
                        prefix={<CheckCircleOutlined />}
                    />
                </div>
                <div className="bg-red-50 p-4 rounded-lg shadow">
                    <Statistic
                        title={t('attendance.stats.absent')}
                        value={stats.absent}
                        valueStyle={{ color: '#cf1322' }}
                        prefix={<CloseCircleOutlined />}
                    />
                </div>
                <div className="bg-orange-50 p-4 rounded-lg shadow">
                    <Statistic
                        title={t('attendance.stats.late')}
                        value={stats.late}
                        valueStyle={{ color: '#fa8c16' }}
                        prefix={<ClockCircleOutlined />}
                    />
                </div>
                <div className="bg-blue-50 p-4 rounded-lg shadow">
                    <Statistic
                        title={t('attendance.stats.leave')}
                        value={stats.leave}
                        valueStyle={{ color: '#1890ff' }}
                        prefix={<CalendarOutlined />}
                    />
                </div>
                <div className="bg-purple-50 p-4 rounded-lg shadow">
                    <Statistic
                        title={t('attendance.stats.rate')}
                        value={rate}
                        suffix="%"
                        valueStyle={{ color: '#722ed1' }}
                        prefix={<ThunderboltOutlined />}
                    />
                </div>
            </div>

            {/* Action Bar */}
            <div className="flex justify-between mb-2 mx-2 gap-2">
                <Space>
                    <BaseButton onClick={() => setFormData({} as IAddEditAttendance)} icon={<FileAddOutlined />} label={t('Add new')} />

                    <DatePicker
                        picker="month"
                        value={selectedMonth}
                        onChange={value => setSelectedMonth(value || dayjs())}
                        format="MM/YYYY"
                        placeholder={t('attendance.select_month')}
                    />

                    <BaseButton
                        onClick={handleAutoGenerate}
                        loading={autoGenerateLoading}
                        icon={<ThunderboltOutlined />}
                        label={t('attendance.auto_generate')}
                        type="primary"
                    />

                    <BaseButton onClick={() => refetch()} icon={<ReloadOutlined />} label={t('global.refresh')} />
                </Space>

                <Space>
                    <RangePicker
                        value={
                            filter.filters?.find(f => f.key === 'Range')
                                ? [
                                      dayjs(filter.filters.find(f => f.key === 'Range')?.value[0]),
                                      dayjs(filter.filters.find(f => f.key === 'Range')?.value[1]),
                                  ]
                                : [dayjs().startOf('month'), dayjs().endOf('month')]
                        }
                        onChange={dates => {
                            if (dates && dates[0] && dates[1]) {
                                handleFilterChange('Range', [dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
                            }
                        }}
                        format="DD/MM/YYYY"
                    />

                    <Select
                        placeholder={t('attendance.filter.employee')}
                        allowClear
                        style={{ width: 200 }}
                        showSearch
                        optionFilterProp="children"
                        onChange={value => handleFilterChange('EmployeeId', value ? [value] : [])}
                        options={employeesData?.data?.map((emp: any) => ({ label: emp.fullName, value: emp.id })) || []}
                    />

                    <Select
                        placeholder={t('attendance.filter.status')}
                        allowClear
                        style={{ width: 150 }}
                        onChange={value => handleFilterChange('Status', value ? [value] : [])}
                        options={[
                            { label: t('attendance.status.present'), value: 0 },
                            { label: t('attendance.status.absent'), value: 1 },
                            { label: t('attendance.status.late'), value: 2 },
                            { label: t('attendance.status.leave'), value: 3 },
                        ]}
                    />

                    <Search
                        placeholder={t('global.search_table')}
                        allowClear
                        className="btn-search-table"
                        onSearch={value => {
                            setFilter({ ...filter, search: value, pageNumber: 1 });
                        }}
                    />
                </Space>
            </div>

            {/* Table */}
            <AttendanceTable<IAttendanceData>
                bordered
                dataSource={data?.data || []}
                loading={isLoading}
                rowKey="id"
                wrapClassName="!h-full w-full"
                pagination={{
                    current: filter.pageNumber,
                    pageSize: filter.pageSize,
                    total: data?.totalItems || 0,
                    showSizeChanger: true,
                    showTotal: total => `${t('global.total')} ${total} ${t('global.records')}`,
                    onChange: (page, pageSize) => {
                        setFilter({ ...filter, pageNumber: page, pageSize });
                    },
                }}
            >
                <Column
                    title={t('category.list.index')}
                    dataIndex="index"
                    width={60}
                    key="index"
                    render={(_, __, index: number) => (
                        <div className="flex items-center justify-center">{(filter.pageNumber - 1) * filter.pageSize + (index + 1)}</div>
                    )}
                />

                <Column
                    title={t('attendance.employee')}
                    dataIndex="employeeName"
                    width={200}
                    key="employee"
                    render={(_, record: IAttendanceData) => (
                        <div className="flex items-center gap-2">
                            <Avatar size={32} style={{ backgroundColor: '#1890ff' }}>
                                {record.employeeName?.charAt(0).toUpperCase() || 'N'}
                            </Avatar>
                            <span
                                className="text-blue-600 cursor-pointer hover:underline"
                                onClick={() =>
                                    setFormData({
                                        id: record.id,
                                        employeeId: record.employeeId,
                                        workDate: record.workDate,
                                        status: record.status,
                                        note: record.note,
                                    } as IAddEditAttendance)
                                }
                            >
                                {record.employeeName || record.employeeId}
                            </span>
                        </div>
                    )}
                />

                <Column
                    title={t('attendance.work_date')}
                    dataIndex="workDate"
                    width={120}
                    key="workDate"
                    render={(_, record: IAttendanceData) => dayjs(record.workDate).format('DD/MM/YYYY')}
                    sorter={(a: IAttendanceData, b: IAttendanceData) => dayjs(a.workDate).unix() - dayjs(b.workDate).unix()}
                />

                <Column
                    title={t('attendance.status')}
                    dataIndex="status"
                    width={120}
                    key="status"
                    render={(_, record: IAttendanceData) => renderStatus(record.status)}
                />

                <Column title={t('attendance.note')} dataIndex="note" width={250} key="note" ellipsis />

                <Column
                    title={t('attendance.auto_generated')}
                    dataIndex="isAutoGenerated"
                    width={120}
                    key="isAutoGenerated"
                    render={(_, record: IAttendanceData) =>
                        record.isAutoGenerated ? <Tag color="blue">{t('global.yes')}</Tag> : <Tag>{t('global.no')}</Tag>
                    }
                />

                <Column
                    title={t('Created at')}
                    dataIndex="created"
                    width={180}
                    key="created"
                    render={(_, record: IAttendanceData) => (
                        <div>
                            <div>{formatDateTime(record.created)}</div>
                            <div className="text-xs text-gray-500">{record.createdByName}</div>
                        </div>
                    )}
                />

                <Column
                    title={t('global.action')}
                    key="action"
                    fixed="right"
                    width={100}
                    align="center"
                    render={(_, record: IAttendanceData) => (
                        <Space size="small">
                            <Tooltip title={t('global.edit')}>
                                <Button
                                    type="link"
                                    icon={<EditOutlined />}
                                    onClick={() =>
                                        setFormData({
                                            id: record.id,
                                            employeeId: record.employeeId,
                                            workDate: record.workDate,
                                            status: record.status,
                                            note: record.note,
                                        } as IAddEditAttendance)
                                    }
                                />
                            </Tooltip>
                            <Popconfirm
                                title={t('message.confirm_delete')}
                                onConfirm={() => handleDelete(record.id)}
                                okText={t('global.yes')}
                                cancelText={t('global.no')}
                            >
                                <Tooltip title={t('global.delete')}>
                                    <Button type="link" danger icon={<DeleteOutlined />} />
                                </Tooltip>
                            </Popconfirm>
                        </Space>
                    )}
                />
            </AttendanceTable>

            <ModalAddEditAttendance formData={formData} handleClose={handleClose} />
        </div>
    );
};

export default AttendancePage;
