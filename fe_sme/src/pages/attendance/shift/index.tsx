// import { apiDeleteShift, apiSearchShifts } from '@/api/attendance.api';
// import { useLocale } from '@/i18n';
// import { ClockCircleOutlined, DeleteOutlined, FilterOutlined, PlusOutlined, SettingOutlined } from '@ant-design/icons';
// import { useQuery } from '@tanstack/react-query';
// import { Button, Modal, Select, Tag, Tooltip } from 'antd';
// import { useState } from 'react';

// import BaseButton from '@/components/button';
// import Search from '@/components/search';
// import ShiftTable from '@/components/table';
// import { notify } from '@/components/toast-message';

// import { handleCommonError } from '@/utils/helpers';

// import { IAttendanceShiftData, ShiftType, getShiftTypeLabel } from '@/interface/attendance';

// import ShiftFormDrawer from './components/ShiftFormDrawer';
// import './index.less';

// const { Column } = ShiftTable;

// interface ShiftFilter {
//     pageNumber: number;
//     pageSize: number;
//     search?: string;
//     filters?: any[];
// }

// export default function AttendanceShiftPage() {
//     const { t } = useLocale();

//     // State management
//     const [selectedRecord, setSelectedRecord] = useState<IAttendanceShiftData | null>(null);
//     const [drawerVisible, setDrawerVisible] = useState(false);

//     // Filter state
//     const [filter, setFilter] = useState<ShiftFilter>({
//         pageNumber: 1,
//         pageSize: 10,
//         search: undefined,
//     });

//     const [shiftTypeFilter, setShiftTypeFilter] = useState<number | undefined>(undefined);
//     const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);

//     // Use React Query
//     const { data, refetch, isLoading } = useQuery({
//         queryKey: ['getListShifts', filter, shiftTypeFilter, activeFilter],
//         queryFn: async () => {
//             const filters: any[] = [];
//             if (shiftTypeFilter !== undefined) {
//                 filters.push({ key: 'shiftType', value: [shiftTypeFilter] });
//             }
//             if (activeFilter !== undefined) {
//                 filters.push({ key: 'isActive', value: [activeFilter] });
//             }

//             const params = {
//                 ...filter,
//                 filters: filters.length > 0 ? filters : undefined,
//             };

//             const res = await apiSearchShifts(params);
//             return res;
//         },
//     });

//     const handleDelete = async (id: string) => {
//         try {
//             const response = await apiDeleteShift(id);
//             if (response.succeeded) {
//                 notify.success(t('shift.message.delete_success'));
//                 refetch();
//             } else {
//                 throw response;
//             }
//         } catch (error) {
//             handleCommonError(error, t);
//         }
//     };

//     const handleRowClick = (record: IAttendanceShiftData) => {
//         setSelectedRecord(record);
//         setDrawerVisible(true);
//     };

//     const handleCreate = () => {
//         setSelectedRecord(null);
//         setDrawerVisible(true);
//     };

//     const confirmDelete = (e: React.MouseEvent, record: IAttendanceShiftData) => {
//         e.stopPropagation(); // Prevent row click
//         Modal.confirm({
//             title: t('shift.delete_confirm'),
//             content: t('shift.delete_confirm_message'),
//             okText: t('global.popup.confirm'),
//             okType: 'danger',
//             cancelText: t('global.cancel'),
//             onOk: () => handleDelete(record.id),
//         });
//     };

//     const formatTime = (time: string) => {
//         return time.substring(0, 5);
//     };

//     const renderShiftType = (type: ShiftType) => {
//         const colors: Record<ShiftType, string> = {
//             [ShiftType.MORNING]: 'gold',
//             [ShiftType.AFTERNOON]: 'orange',
//             [ShiftType.NIGHT]: 'purple',
//             [ShiftType.FULL_DAY]: 'green',
//             [ShiftType.FLEXIBLE]: 'blue',
//         };
//         return <Tag color={colors[type]}>{getShiftTypeLabel(type)}</Tag>;
//     };

//     const renderStatus = (isActive: boolean) => {
//         return <Tag color={isActive ? 'success' : 'default'}>{isActive ? t('shift.status.active') : t('shift.status.inactive')}</Tag>;
//     };

//     return (
//         <div className="h-full flex flex-col p-4">
//             {/* Action Bar */}
//             <div className="flex justify-between mb-4 gap-2">
//                 <div>
//                     <BaseButton type="primary" onClick={handleCreate} icon={<PlusOutlined />} label={t('shift.add')} />
//                 </div>

//                 <div className="flex items-center gap-2">
//                     <Search
//                         placeholder={t('global.search_table')}
//                         allowClear
//                         className="w-96"
//                         onSearch={value => {
//                             setFilter({ ...filter, search: value, pageNumber: 1 });
//                         }}
//                     />

//                     <Select
//                         placeholder={t('shift.type')}
//                         onChange={value => {
//                             setShiftTypeFilter(value);
//                             setFilter({ ...filter, pageNumber: 1 });
//                         }}
//                         value={shiftTypeFilter}
//                         allowClear
//                         style={{ width: 140 }}
//                         options={[
//                             { label: t('shift.type.morning'), value: ShiftType.MORNING },
//                             { label: t('shift.type.afternoon'), value: ShiftType.AFTERNOON },
//                             { label: t('shift.type.night'), value: ShiftType.NIGHT },
//                             { label: t('shift.type.flexible'), value: ShiftType.FLEXIBLE },
//                         ]}
//                     />

//                     <Select
//                         placeholder={t('shift.status')}
//                         onChange={value => {
//                             setActiveFilter(value);
//                             setFilter({ ...filter, pageNumber: 1 });
//                         }}
//                         value={activeFilter}
//                         allowClear
//                         style={{ width: 120 }}
//                         options={[
//                             { label: t('shift.status.active'), value: true },
//                             { label: t('shift.status.inactive'), value: false },
//                         ]}
//                     />

//                     <Tooltip title={t('menu.filter')}>
//                         <Button icon={<FilterOutlined />} />
//                     </Tooltip>

//                     <Tooltip title={t('menu.configuration')}>
//                         <Button icon={<SettingOutlined />} />
//                     </Tooltip>
//                 </div>
//             </div>

//             {/* Table */}
//             <ShiftTable<IAttendanceShiftData>
//                 dataSource={data?.data || []}
//                 rowKey="id"
//                 wrapClassName="!h-full w-full"
//                 loading={isLoading}
//                 onRow={record => ({
//                     onClick: () => handleRowClick(record),
//                     style: { cursor: 'pointer' },
//                 })}
//                 pagination={{
//                     current: filter.pageNumber,
//                     pageSize: filter.pageSize,
//                     total: data?.totalItems,
//                     onChange: (page, pageSize) => {
//                         setFilter({ ...filter, pageNumber: page, pageSize });
//                     },
//                 }}
//             >
//                 <Column
//                     title={<div className="flex items-center justify-center">{t('category.list.index')}</div>}
//                     dataIndex="index"
//                     key="index"
//                     onCell={() => ({ width: 50 })}
//                     onHeaderCell={() => ({ style: { width: 50, minWidth: 50 } })}
//                     render={(_, __, index: number) => (
//                         <div className="flex items-center justify-center mb-0">{(filter.pageNumber - 1) * filter.pageSize + (index + 1)}</div>
//                     )}
//                 />

//                 <Column
//                     title={t('shift.code')}
//                     dataIndex="code"
//                     key="code"
//                     width={120}
//                     render={(code: string) => <strong className="text-blue-600">{code}</strong>}
//                 />

//                 <Column title={t('shift.name')} dataIndex="name" key="name" width={200} />

//                 <Column
//                     title={t('shift.type')}
//                     dataIndex="shiftType"
//                     key="shiftType"
//                     width={120}
//                     align="center"
//                     render={(type: ShiftType) => renderShiftType(type)}
//                 />

//                 <Column
//                     title={t('shift.start_time')}
//                     dataIndex="startTime"
//                     key="startTime"
//                     width={100}
//                     align="center"
//                     render={(time: string) => (
//                         <Tag color="success" icon={<ClockCircleOutlined />}>
//                             {formatTime(time)}
//                         </Tag>
//                     )}
//                 />

//                 <Column
//                     title={t('shift.end_time')}
//                     dataIndex="endTime"
//                     key="endTime"
//                     width={100}
//                     align="center"
//                     render={(time: string) => (
//                         <Tag color="error" icon={<ClockCircleOutlined />}>
//                             {formatTime(time)}
//                         </Tag>
//                     )}
//                 />

//                 <Column
//                     title={t('shift.working_hours')}
//                     dataIndex="requiredWorkingHours"
//                     key="requiredWorkingHours"
//                     width={120}
//                     align="center"
//                     render={(hours: number) => (
//                         <div className="font-semibold">
//                             <ClockCircleOutlined className="mr-1" />
//                             {hours}h
//                         </div>
//                     )}
//                 />

//                 <Column
//                     title={t('shift.grace_period')}
//                     dataIndex="gracePeriodMinutes"
//                     key="gracePeriodMinutes"
//                     width={120}
//                     align="center"
//                     render={(minutes: number) => <span>{minutes} phút</span>}
//                 />

//                 <Column
//                     title={t('shift.status')}
//                     dataIndex="isActive"
//                     key="isActive"
//                     width={100}
//                     align="center"
//                     render={(isActive: boolean) => renderStatus(isActive)}
//                 />

//                 <Column
//                     key="action"
//                     width={60}
//                     fixed="right"
//                     render={(_, record: IAttendanceShiftData) => (
//                         <div className="flex gap-1" onClick={e => e.stopPropagation()}>
//                             <Tooltip title={t('global.delete')}>
//                                 <Button type="text" danger icon={<DeleteOutlined />} onClick={e => confirmDelete(e, record)} />
//                             </Tooltip>
//                         </div>
//                     )}
//                 />
//             </ShiftTable>

//             {/* Form Drawer */}
//             <ShiftFormDrawer
//                 visible={drawerVisible}
//                 onClose={() => setDrawerVisible(false)}
//                 onSuccess={() => {
//                     setDrawerVisible(false);
//                     refetch();
//                 }}
//                 record={selectedRecord}
//             />
//         </div>
//     );
// }
