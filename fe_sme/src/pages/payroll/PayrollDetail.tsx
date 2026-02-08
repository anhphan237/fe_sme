import { apiGetPayrollDetailById } from '@/api/finance.api';
import { AppRouters } from '@/constants';
import { useLocale } from '@/i18n';
import { LeftOutlined } from '@ant-design/icons';
import { Tag } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import BaseButton from '@/components/button';

interface IPayrollDetail {
    payrollCode: string;
    month: string;
    createdAt: string;
    createdBy: string;
    closedAt?: string;
    employeeCode: string;
    employeeName: string;
    department: string;
    position: string;
    workingDays: number;
    otHours: number;
    baseSalary: number;
    salaryCoefficient: number;
    allowances: { label: string; amount: number }[];
    totalAllowance: number;
    deductions: { label: string; amount: number }[];
    totalDeduction: number;
    taxTNCN: number;
    bhxh_employee: number;
    bhxh_company: number;
    totalBeforeTax: number;
    totalAfterTax: number;
    totalReceive: number;
}

export default function PayrollDetailPage() {
    const { t } = useLocale();
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState<IPayrollDetail | null>(null);

    // const { data } = useQuery({
    //     queryKey: ['getListPayrollCycle', id],
    //     queryFn: async () => {
    //         const cleanFilter = { ...filter };
    //         // if (!cleanFilter.range?.from || !cleanFilter.range?.to) {
    //         //     delete cleanFilter.range;
    //         // }
    //         const res = await apiGetPayrollDetailById(cleanFilter)
    //         return res;
    //     },
    // });

    useEffect(() => {
        fetchDetail();
    }, []);

    const fetchDetail = async () => {
        const res = await fakeApiDetail(id!);
        setData(res);
    };

    return (
        <div className="h-full mx-4 flex flex-col gap-3">
            <div className="shrink-0">
                <BaseButton onClick={() => navigate(AppRouters.PAYROLL)} icon={<LeftOutlined />} label={t('global.back')} />
            </div>
            <div className="bg-white flex-1 overflow-y-auto p-4 rounded-lg space-y-6">
                <div className="border p-4 rounded-lg border-gray-200">
                    <h2 className="font-semibold text-lg mb-3">Thông tin chung</h2>

                    <div className="grid grid-cols-2 gap-3">
                        <p className="text-base">
                            <span className="font-medium">Mã bảng lương:</span> {data?.payrollCode}
                        </p>
                        <p className="text-base">
                            <span className="font-medium">Tháng:</span>{' '}
                            <Tag className="text-base" color="success">
                                {data?.month}
                            </Tag>
                        </p>
                        <p className="text-base">
                            <span className="font-medium">Ngày tạo:</span> <Tag className="text-base">{data?.createdAt}</Tag>
                        </p>
                        <p className="text-base">
                            <span className="font-medium">Người tạo:</span> {data?.createdBy}
                        </p>
                        {data?.closedAt && (
                            <p className="text-base">
                                <span className="font-medium">Ngày chốt lương:</span> <Tag className="text-base">{data?.closedAt}</Tag>
                            </p>
                        )}
                    </div>
                </div>

                <div className="border p-4 rounded-lg border-gray-200">
                    <h2 className="font-semibold text-lg mb-3">Thông tin nhân viên</h2>

                    <div className="grid grid-cols-2 gap-3">
                        <p className="text-base">
                            <span className="font-medium">Mã NV:</span>{' '}
                            <Tag className="text-base" color="volcano">
                                {data?.employeeCode}
                            </Tag>
                        </p>
                        <p className="text-base">
                            <span className="font-medium">Họ tên:</span> {data?.employeeName}
                        </p>
                        <p className="text-base">
                            <span className="font-medium">Phòng ban:</span> {data?.department}
                        </p>
                        <p className="text-base">
                            <span className="font-medium">Chức vụ:</span> {data?.position}
                        </p>
                    </div>
                </div>

                <div className="border p-4 rounded-lg border-gray-200">
                    <h2 className="font-semibold text-lg mb-3">Chấm công</h2>

                    <div className="grid grid-cols-2 gap-3">
                        <p className="text-base">
                            <span className="font-medium">Ngày công:</span>{' '}
                            <Tag className="text-base" color="green-inverse">
                                {data?.workingDays}
                            </Tag>
                        </p>
                        <p className="text-base">
                            <span className="font-medium">Giờ OT:</span>{' '}
                            <Tag className="text-base" color="volcano-inverse">
                                {data?.otHours}
                            </Tag>
                        </p>
                    </div>
                </div>

                <div className="border p-4 rounded-lg border-gray-200">
                    <h2 className="font-semibold text-lg mb-3">Thu nhập</h2>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <p className="text-base">
                            <span className="font-medium">Lương cơ bản:</span>{' '}
                            <span className="text-lg font-semibold">{data?.baseSalary.toLocaleString()} đ</span>
                        </p>
                        <p className="text-base">
                            <span className="font-medium">Hệ số lương:</span> <Tag>{data?.salaryCoefficient}</Tag>
                        </p>
                        <p className="text-base">
                            <span className="font-medium">Tổng phụ cấp:</span>{' '}
                            <span className="text-lg font-semibold">{data?.totalAllowance.toLocaleString()} đ</span>
                        </p>
                    </div>

                    <div className="text-base">
                        <span className="font-medium flex mb-2">Chi tiết phụ cấp:</span>
                        {data?.allowances.map((a, i) => (
                            <div key={i} className="flex justify-between text-base py-1 ml-4">
                                <span>- {a.label}</span>
                                <span className="text-lg font-semibold">{a.amount.toLocaleString()} đ</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border p-4 rounded-lg border-gray-200">
                    <h2 className="font-semibold text-lg mb-3">Các khoản khấu trừ</h2>

                    <div className="grid grid-cols-2 gap-3 mb-3 text-base">
                        <p>
                            <span className="font-medium">Tổng khấu trừ:</span>{' '}
                            <span className="text-lg font-semibold">-{data?.totalDeduction.toLocaleString()} đ</span>
                        </p>
                        <p>
                            <span className="font-medium">Thuế TNCN:</span>{' '}
                            <span className="text-lg font-semibold">-{data?.taxTNCN.toLocaleString()} đ</span>
                        </p>
                        <p>
                            <span className="font-medium">BHXH nhân viên đóng:</span>{' '}
                            <span className="text-lg font-semibold">-{data?.bhxh_employee.toLocaleString()} đ</span>
                        </p>
                        <p>
                            <span className="font-medium">BHXH công ty đóng:</span>{' '}
                            <span className="text-lg font-semibold">{data?.bhxh_company.toLocaleString()} đ</span>
                        </p>
                    </div>

                    <span className="flex text-base font-medium mb-2">Chi tiết khấu trừ:</span>
                    {data?.deductions.map((d, i) => (
                        <div key={i} className="flex justify-between text-base py-1 ml-4">
                            <span>- {d.label}</span>
                            <span className="text-lg font-semibold">-{d.amount.toLocaleString()} đ</span>
                        </div>
                    ))}
                </div>

                <div className="p-4 border rounded-lg">
                    <h2 className="font-semibold text-lg mb-3">Kết quả lương cuối</h2>

                    <p className="text-base">
                        <span className="font-medium">Tổng thu nhập trước thuế:</span>{' '}
                        <span className="text-lg font-semibold">{data?.totalBeforeTax.toLocaleString()} đ</span>
                    </p>
                    <p className="text-base">
                        <span className="font-medium">Tổng thu nhập sau thuế:</span>{' '}
                        <span className="text-lg font-semibold">{data?.totalAfterTax.toLocaleString()} đ</span>
                    </p>

                    <div className="text-2xl font-bold text-colorPrimary mt-3 text-right">{data?.totalReceive.toLocaleString()} đ</div>
                </div>
            </div>
        </div>
    );
}

async function fakeApiDetail(id: string): Promise<IPayrollDetail> {
    return {
        payrollCode: 'PR-2025-001',
        month: '11/2025',
        createdAt: '01/11/2025',
        createdBy: 'Admin',
        closedAt: '30/11/2025',

        employeeCode: 'NV001',
        employeeName: 'Nguyễn Văn A',
        department: 'Kế toán',
        position: 'Nhân viên',

        workingDays: 22,
        otHours: 10,

        baseSalary: 12000000,
        salaryCoefficient: 1.2,

        allowances: [
            { label: 'Phụ cấp ăn trưa', amount: 800000 },
            { label: 'Phụ cấp xăng xe', amount: 500000 },
        ],
        totalAllowance: 1300000,

        deductions: [
            { label: 'BHXH', amount: 800000 },
            { label: 'Đi muộn', amount: 150000 },
        ],
        totalDeduction: 950000,

        taxTNCN: 300000,
        bhxh_employee: 800000,
        bhxh_company: 1500000,

        totalBeforeTax: 12000000 + 1300000,
        totalAfterTax: 12000000 + 1300000 - 950000,
        totalReceive: 12000000 + 1300000 - 950000 - 300000,
    };
}
