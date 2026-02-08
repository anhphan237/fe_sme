import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import { Tag } from 'antd';
import React from 'react';

import TrackingStatus from './components/tracking-status';

const ContractDetail = () => {
    const data = {
        employeeName: 'Hoang Trinh',
        company: 'CTY ABC',
        contractNo: 'HD0000001',
        employeeCode: 'NV0000001',
        signDate: '15/11/2025',
        effectiveDate: '15/11/2025',
        expireDate: '15/01/2026',
        contractType: 'Thử việc',
        workType: 'Toàn thời gian',
        status: 'Có hiệu lực', // Có hiệu lực | Hết hạn | Đã hủy | Chờ duyệt
        signedStatus: 'Đã ký', // Đã ký | Chưa ký
        salaryRate: '100%',
    };

    const getStatusTag = (status: string) => {
        switch (status) {
            case 'Có hiệu lực':
                return <Tag color="green">{status}</Tag>;
            case 'Chờ duyệt':
                return <Tag color="gold">{status}</Tag>;
            case 'Hết hạn':
                return <Tag color="volcano">{status}</Tag>;
            case 'Đã hủy':
                return <Tag color="red">{status}</Tag>;
            default:
                return <Tag>{status}</Tag>;
        }
    };

    const getSignedTag = (status: string) => {
        switch (status) {
            case 'Đã ký':
                return (
                    <Tag icon={<CheckCircleOutlined />} color="green">
                        {status}
                    </Tag>
                );
            case 'Chưa ký':
                return (
                    <Tag icon={<ClockCircleOutlined />} color="orange">
                        {status}
                    </Tag>
                );
            default:
                return <Tag>{status}</Tag>;
        }
    };

    const employeeInfo = [
        { label: 'Họ và tên NLĐ', value: data.employeeName },
        { label: 'Mã nhân viên', value: <Tag>{data.employeeCode}</Tag> },
        { label: 'Đơn vị ký hợp đồng', value: data.company },
        { label: 'Vị trí công việc', value: 'Frontend Developer' },
        { label: 'Lương cơ bản', value: '-' },
        { label: 'Lương đóng bảo hiểm', value: '-' },
        { label: 'Tỷ lệ hưởng lương', value: data.salaryRate },
        { label: 'Tệp đính kèm', value: '--' },
        { label: 'Trích yếu', value: '-' },
        { label: 'Ghi chú', value: '-' },
    ];

    const contractInfo = [
        { label: 'Số hợp đồng', value: <Tag>{data?.contractNo}</Tag> },
        { label: 'Tên hợp đồng', value: 'AaBbCc' },
        { label: 'Loại hợp đồng', value: data.contractType },
        { label: 'Hình thức làm việc', value: data.workType },
        { label: 'Ngày ký', value: data.signDate },
        { label: 'Ngày có hiệu lực', value: data.effectiveDate },
        { label: 'Ngày hết hạn', value: data.expireDate },
        { label: 'Người đại diện công ty ký', value: '-' },
        { label: 'Chức danh người đại diện', value: '-' },
        {
            label: 'Trạng thái ký',
            value: getSignedTag(data.signedStatus),
        },
        {
            label: 'Trạng thái hợp đồng',
            value: getStatusTag(data.status),
        },
    ];

    const renderSection = (items: { label: string; value: any; highlight?: boolean }[], title: string) => (
        <div className="flex-1 space-y-4 bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-4">{title}</h2>
            {items.map((item, i) => (
                <div
                    key={i}
                    className={`flex justify-between border-b border-gray-100 pb-3 ${item.highlight ? 'bg-green-50 px-3 py-2 rounded-md' : ''}`}
                >
                    <span className={`font-medium ${item.highlight ? 'text-green-700' : 'text-gray-600'}`}>{item.label}</span>
                    <span className={`${item.highlight ? 'text-green-800 font-semibold' : 'text-gray-900'}`}>{item.value}</span>
                </div>
            ))}
        </div>
    );

    return (
        <div className="mx-auto h-full p-6 bg-gray-50 overflow-y-auto">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800">
                        {data.contractNo} - {data.employeeName}
                    </h1>
                    <p className="text-gray-500 mt-1">{data.company}</p>
                </div>
            </div>

            {/* Sections */}
            <div className="flex flex-col md:flex-row gap-6">
                {renderSection(employeeInfo, 'Thông tin nhân viên')}
                {renderSection(contractInfo, 'Thông tin hợp đồng')}
            </div>

            {/* Optional: Tracking Status */}
            <div className="mt-6">
                <TrackingStatus currentStep={1} />
            </div>
        </div>
    );
};

export default ContractDetail;
