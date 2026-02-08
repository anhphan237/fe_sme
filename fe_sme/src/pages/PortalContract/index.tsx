import { useLocale } from '@/i18n';
import { DatePicker, Select } from 'antd';
import React, { useState } from 'react';

import Search from '@/components/search';
import MyTable from '@/components/table';

const { RangePicker } = DatePicker;

interface IContractData {
    id: string;
    employeeCode: string;
    employeeName: string;
    department: string;
    position: string;
    contractType: string;
    signDate: string;
    expireDate: string;
    salaryAdjust: string;
    proposedSalary: string;
    currentSalary: string;
    selfEvaluate: string;
    directManagerEvaluate: string;
    directorEvaluate: string;
}

const PortalContract: React.FC = () => {
    const { t } = useLocale();
    const [filter, setFilter] = useState({
        fromDate: '',
        toDate: '',
        status: 'Chờ phê duyệt',
        pageNumber: 1,
        pageSize: 10,
    });

    const [data, setData] = useState<{ data: IContractData[]; totalItems: number }>({
        data: [
            {
                id: '1',
                employeeCode: 'NV001',
                employeeName: 'Nguyễn Văn A',
                department: 'Phòng Kinh Doanh',
                position: 'Nhân viên kinh doanh',
                contractType: 'Hợp đồng 1 năm',
                signDate: '15/11/2024',
                expireDate: '15/11/2025',
                salaryAdjust: 'Có',
                proposedSalary: '18,000,000',
                currentSalary: '16,000,000',
                selfEvaluate: 'Hoàn thành tốt',
                directManagerEvaluate: 'Xuất sắc',
                directorEvaluate: 'Đạt yêu cầu',
            },
            {
                id: '2',
                employeeCode: 'NV002',
                employeeName: 'Trần Thị B',
                department: 'Phòng Hành Chính',
                position: 'Chuyên viên nhân sự',
                contractType: 'Hợp đồng thử việc',
                signDate: '10/10/2024',
                expireDate: '10/12/2025',
                salaryAdjust: 'Không',
                proposedSalary: '14,000,000',
                currentSalary: '14,000,000',
                selfEvaluate: 'Tốt',
                directManagerEvaluate: 'Tốt',
                directorEvaluate: 'Cần cải thiện',
            },
            {
                id: '3',
                employeeCode: 'NV003',
                employeeName: 'Phạm Văn C',
                department: 'Phòng IT',
                position: 'Lập trình viên',
                contractType: 'Hợp đồng không thời hạn',
                signDate: '01/01/2022',
                expireDate: 'Không áp dụng',
                salaryAdjust: 'Có',
                proposedSalary: '25,000,000',
                currentSalary: '22,000,000',
                selfEvaluate: 'Xuất sắc',
                directManagerEvaluate: 'Xuất sắc',
                directorEvaluate: 'Đạt yêu cầu',
            },
        ],
        totalItems: 3,
    });

    return (
        <div className="p-4 flex flex-col gap-4 h-full">
            <div className="flex gap-4 items-center justify-end mx-2 ">
                <div className="flex flex-col">
                    <RangePicker className="w-80 min-w-80" placeholder={[t('global.from_date'), t('global.to_date')]} />
                </div>
                <div className="flex flex-col">
                    <Select
                        value={filter.status}
                        mode="multiple"
                        className="w-72 min-w-72"
                        placeholder={t('global.status')}
                        onChange={value => setFilter({ ...filter, status: value })}
                        options={[
                            { label: 'Chờ phê duyệt', value: 'Chờ phê duyệt' },
                            { label: 'Đã duyệt', value: 'Đã duyệt' },
                            { label: 'Từ chối', value: 'Từ chối' },
                        ]}
                    />
                </div>

                <div className="flex flex-col w-max">
                    <Search placeholder={t('global.search_table')} allowClear className="btn-search-table min-w-72" />
                </div>
            </div>
            <div className="flex-1 overflow-hidden">
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
                        title={<div className="flex items-center justify-center">STT</div>}
                        dataIndex="index"
                        key="index"
                        onCell={() => ({ width: 50 })}
                        render={(_, __, index: number) => (
                            <div className="flex items-center justify-center mb-0">{(filter.pageNumber - 1) * filter.pageSize + (index + 1)}</div>
                        )}
                    />
                    <MyTable.Column title="Mã nhân viên" dataIndex="employeeCode" key="employeeCode" width={150} className="!text-center" />
                    <MyTable.Column title="Tên nhân viên" dataIndex="employeeName" key="employeeName" width={180} className="!text-center" />
                    <MyTable.Column title="Phòng ban" dataIndex="department" key="department" width={180} className="!text-center" />
                    <MyTable.Column title="Vị trí" dataIndex="position" key="position" width={180} className="!text-center" />
                    <MyTable.Column title="Loại hợp đồng" dataIndex="contractType" key="contractType" width={180} className="!text-center" />
                    <MyTable.Column title="Ngày ký" dataIndex="signDate" key="signDate" width={160} className="!text-center" />
                    <MyTable.Column title="Ngày hết hạn" dataIndex="expireDate" key="expireDate" width={160} className="!text-center" />
                    <MyTable.Column title="Điều chỉnh lương" dataIndex="salaryAdjust" key="salaryAdjust" width={160} className="!text-center" />
                    <MyTable.Column title="Mức lương đề xuất" dataIndex="proposedSalary" key="proposedSalary" width={160} className="!text-center" />
                    <MyTable.Column title="Mức lương hiện tại" dataIndex="currentSalary" key="currentSalary" width={160} className="!text-center" />
                    <MyTable.Column title="Cá nhân tự đánh giá" dataIndex="selfEvaluate" key="selfEvaluate" width={180} className="!text-center" />
                    <MyTable.Column
                        title="Quản lý trực tiếp đánh giá"
                        dataIndex="directManagerEvaluate"
                        key="directManagerEvaluate"
                        width={220}
                        className="!text-center"
                    />
                    <MyTable.Column
                        title="Trưởng đơn vị / Giám đốc trung tâm đánh giá"
                        dataIndex="directorEvaluate"
                        key="directorEvaluate"
                        width={280}
                        className="!text-center"
                    />
                </MyTable>
            </div>
        </div>
    );
};

export default PortalContract;
