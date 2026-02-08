import BaseButton from '@/components/button';
import { CheckCircleOutlined, ClockCircleOutlined, EditOutlined, PrinterOutlined } from '@ant-design/icons';
import { Card, Collapse, Tag } from 'antd';
import React from 'react';

const { Panel } = Collapse;

const PortalContractRate: React.FC = () => {
    const employeeInfo = {
        id: '2214',
        name: 'Vũ Thành Nam',
        position: 'Lập trình viên',
        joinDate: '15/08/2022',
        dob: '09/08/1994',
        contractType: 'Hợp đồng lao động xác định thời hạn 2 năm',
        expireDate: '14/10/2025',
        manager: 'Dương Ngọc Anh',
        managerTitle: 'Giám đốc Trung tâm Phần mềm',
        department: 'Trung tâm Phần mềm số 16/DU16.3',
        seniority: '3 năm 2 tháng 28 ngày',
        nextContractType: 'Hợp đồng lao động xác định thời hạn 2 năm',
    };

    const approvals = [
        { id: '2214', name: 'Vũ Thành Nam', role: 'Nhân viên báo cáo kết quả công việc', status: 'done' },
        { id: '2077', name: 'Lê Thị Thanh Ngoan', role: 'Quản lý trực tiếp đánh giá', status: 'done' },
        { id: '0235', name: 'Dương Ngọc Anh', role: 'Trưởng đơn vị nhận xét, đánh giá', status: 'waiting' },
    ];

    const history = [
        { user: 'Dương Ngọc Anh', action: 'Đã duyệt', time: '22/09/2025 15:23' },
        { user: 'Lê Thị Thanh Ngoan', action: 'Đã xác nhận', time: '22/09/2025 14:52' },
        { user: 'Dương Ngọc Anh', action: 'Ủy quyền cho Lê Thị Thanh Ngoan', time: '22/09/2025 10:34' },
        { user: 'Vũ Thành Nam', action: 'Gửi duyệt cho Dương Ngọc Anh', time: '22/09/2025 09:50' },
    ];

    return (
        <div className="p-6 bg-gradient-to-br from-gray-50 to-white flex flex-col gap-4 h-full overflow-y-auto">
            <h2 className="text-xl font-semibold tracking-wide flex items-center gap-2">Phiếu đánh giá gia hạn hợp đồng lao động</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                 {/* Thông tin nhân sự */}
                <Card
                    className="lg:col-span-2 rounded-lg"
                    title={<span className="text-colorPrimary font-semibold">Thông tin nhân sự</span>}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4 text-[15px]">
                        <p>
                            <strong>ID nhân sự:</strong> <Tag color="blue">{employeeInfo.id}</Tag>
                        </p>
                        <p>
                            <strong>Họ và tên:</strong> {employeeInfo.name}
                        </p>
                        <p>
                            <strong>Vị trí:</strong> {employeeInfo.position}
                        </p>
                        <p>
                            <strong>Ngày vào công ty:</strong> {employeeInfo.joinDate}
                        </p>
                        <p>
                            <strong>Ngày sinh:</strong> {employeeInfo.dob}
                        </p>
                        <p>
                            <strong>Thâm niên:</strong> {employeeInfo.seniority}
                        </p>
                        <p>
                            <strong>Trung tâm:</strong> {employeeInfo.department}
                        </p>
                        <p>
                            <strong>Quản lý trực tiếp:</strong> {employeeInfo.manager}
                        </p>
                        <p>
                            <strong>Loại hợp đồng:</strong> {employeeInfo.contractType}
                        </p>
                        <p>
                            <strong>Hết hạn:</strong> <Tag color="red">{employeeInfo.expireDate}</Tag>
                        </p>
                        <p className="md:col-span-2">
                            <strong>Loại HĐ tiếp theo:</strong> <Tag color="green">{employeeInfo.nextContractType}</Tag>
                        </p>
                    </div>
                </Card>

                {/* Tiến trình duyệt + lịch sử */}
                <Card
                    className="rounded-lg"
                    title={<span className="text-colorPrimary font-semibold">Tiến trình phê duyệt</span>}
                >
                    <div className="flex flex-col gap-3">
                        {approvals.map(a => (
                            <div
                                key={a.id}
                                className={`flex items-center gap-3 border-b pb-2 ${a.status === 'done' && 'text-green-600'}`}
                            >
                                {a.status === 'done' ? (
                                    <CheckCircleOutlined className="text-green-500 text-lg" />
                                ) : (
                                    <ClockCircleOutlined className="text-yellow-500 text-lg" />
                                )}
                                <div className="flex flex-col">
                                    <span className="font-medium">{a.role}</span>
                                    <span className="text-[14px]">{a.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 border-t pt-3">
                        <h3 className="font-semibold mb-2 text-colorPrimary">Lịch sử</h3>
                        <div className="flex flex-col gap-2 text-[14px]">
                            {history.map((h, idx) => (
                                <div key={idx}>
                                    <p className="font-medium">
                                        {h.user} {h.action}
                                    </p>
                                    <p>{h.time}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>

            <div className="rounded-lg bg-white border">
                <Collapse className='bg-white' accordion bordered={false} defaultActiveKey={['1']} expandIconPosition="end">
                    <Panel header="Nhân viên báo cáo kết quả công việc" key="1">
                        <ul className="list-disc pl-5">
                            <li>Hoàn thành đầy đủ các nhiệm vụ được giao trong kỳ.</li>
                            <li>Tích cực tham gia dự án và hỗ trợ đồng đội khi cần thiết.</li>
                        </ul>
                    </Panel>
                    <Panel header="Quản lý trực tiếp đánh giá" key="2">
                        <ul className="list-disc pl-5">
                            <li>Nhân viên có tinh thần trách nhiệm cao, làm việc chăm chỉ.</li>
                            <li>Cần cải thiện kỹ năng giao tiếp và chủ động hơn trong báo cáo tiến độ.</li>
                        </ul>
                    </Panel>
                    <Panel header="Trưởng đơn vị nhận xét, đánh giá" key="3">
                        <ul className="list-disc pl-5">
                            <li>Đồng ý gia hạn hợp đồng thêm 2 năm.</li>
                            <li>Khuyến khích phát triển lên vị trí Senior Developer.</li>
                        </ul>
                    </Panel>
                </Collapse>
            </div>

            <div className="flex justify-end gap-3 mt-2">
                <BaseButton icon={<EditOutlined />} label='Lưu nháp'/>
                <BaseButton icon={<PrinterOutlined />} label="In phiếu"/>
                <BaseButton type="primary" icon={<CheckCircleOutlined />} label='Gửi duyệt'/>
            </div>
        </div>
    );
};

export default PortalContractRate;
