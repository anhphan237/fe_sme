import { DefaultTenantCode } from '@/constants';
import { useAppSelector } from '@/stores';
import Table, { ColumnsType } from 'antd/es/table';
import moment from 'moment';
import React from 'react';

import LogoLTBMA from '@/assets/logo/ltbma.png';
import LogoQCLD from '@/assets/logo/qcld.png';
import LogoTDP from '@/assets/logo/tdp.jpg';
import QrLTBMA from '@/assets/qr/bma.png';
import QrQCLD from '@/assets/qr/qcld.png';
import QrTDP from '@/assets/qr/tdpdt.png';

import { ProductDetail } from '@/interface/sales';

import './InvoicePrintPage.less';

export interface InvoicePrintContentProps {
    data: {
        customerName: string;
        address: string;
        phone: string;
        code: string;
        details: ProductDetail[];
        totalAmount?: number;
        previousDebt: number;
        deliveryFee: number;
        discount: number;
        invoiceDate?: string;
        totalAmountPaid?: number;
    };
}

const InvoicePrintContent = React.forwardRef<HTMLDivElement, InvoicePrintContentProps>((props, ref) => {
    const { code, customerName, phone, address, details, previousDebt, totalAmount, discount, deliveryFee, invoiceDate, totalAmountPaid } =
        props.data;
    const { userProfileInfo: currentUser } = useAppSelector(state => state.global) ?? {};
    const isSuperAdmin = currentUser?.tenant?.code === DefaultTenantCode.SUPER_ADMIN;
    const hasWeight = details?.some(item => item.weight > 0 && item.weight !== 1);
    const dataCompany = [
        {
            logo: LogoLTBMA,
            name: 'CÔNG TY TNHH LƯƠNG THUẬN BMA',
            desc_1: 'Keo silicone, xơn xịt, sơn mã kẽm, Keo dán xây dựng, keo ron gạch',
            desc_2: 'Sơn bê tông Epoxy và Đá Mài Terrazo',
            address: 'Phú Thịnh, Phú Hội, Đức Trọng, Lâm Đồng',
            phone: '0979.499.499 - 0345.499.499',
            stk_2: '393 668 688 - CÔNG TY TNHH LƯƠNG THUẬN BMA - Ngân hàng ACB',
            stk_1: '3939 339 339 - Lương Duy Thuận - Ngân hàng Vietcombank',
            stk_tt: 'STK: 3939 339 339, Ngân Hàng Vietcombank, Chủ TK: Lương Duy Thuận',
            qr: QrLTBMA,
            // show: currentUser?.tenant?.code === DefaultTenantCode.LTBMA,
            show: true,
        },
        // {
        //     logo: LogoQCLD,
        //     name: 'CÔNG TY TNHH TM DV XD QC LÂM ĐỒNG',
        //     desc_1: 'Tư vấn - Thiết kế - Thi công biển hiệu quảng cáo & công trình xây dựng',
        //     desc_2: '',
        //     address: '608 QL20, Liên Nghĩa, Đức Trọng, Lâm Đồng',
        //     phone: '0368.390.079 - 0869.680.770',
        //     stk_1: '0561 003 905 644 - Voong Dip Hoan - Ngân hàng Vietcombank',
        //     stk_2: '1058 139 437 - CÔNG TY TNHH TM DV XD QC LÂM ĐỒNG - Ngân hàng Vietcombank',
        //     stk_tt: 'STK: 0561 003 905 644, Ngân Hàng Vietcombank, Chủ TK: Voong Dip Hoan',
        //     qr: QrQCLD,
        //     show: currentUser?.tenant?.code === DefaultTenantCode.QCLD,
        // },
        // {
        //     logo: LogoTDP,
        //     name: 'CÔNG TY TNHH TÂN ĐẠI PHÁT ĐỨC TRỌNG',
        //     desc_1: 'Cung Cấp Kính Cường Lực, Thanh Nhôm, Thanh Nhựa, Cửa Nhôm Xingfa, Phụ kiện',
        //     desc_2: 'Kính cao cấp các loại. Phân phối các loại Nhôm - Kính tấm từ 3ly 12ly',
        //     address: '01 Đường Nguyễn Tri Phương, Xã Đức Trọng, Tỉnh Lâm Đồng',
        //     phone: '0978.113.465 - 0834.113.165',
        //     stk_1: '100 870 178 710 - Trần Thị Hồng - Ngân hàng Vietinbank',
        //     stk_2: '111 002 668 361 - CÔNG TY TNHH TÂN ĐẠI PHÁT ĐỨC TRỌNG - Ngân hàng Vietinbank',
        //     stk_tt: '0918 265 842, Ngân Hàng Vietinbank, Chủ TK: Trần Thị Hồng',
        //     qr: QrTDP,
        //     show: currentUser?.tenant?.code === DefaultTenantCode.TDP,
        // },
    ].filter(item => item.show || isSuperAdmin);

    const curentData = dataCompany?.[0];

    const InvoiceHeader = () => {
        return (
            <div className="flex items-start gap-6 pb-4">
                <div className="w-36 flex-shrink-0">
                    <img src={curentData?.logo} alt="Company Logo" className="w-full h-auto" />
                    {/* <img src={curentData?.qr} alt="Company QR" className="w-full h-auto" /> */}
                </div>

                <div className="flex-1 text-center leading-relaxed">
                    <h1 className="text-2xl font-bold uppercase text-black">{curentData?.name}</h1>

                    <p className="text-base">
                        <span className="font-semibold">Chuyên:</span> {curentData?.desc_1}
                    </p>
                    {curentData?.desc_2 && <p className="text-base">{curentData?.desc_2}</p>}

                    <p className="text-base">
                        <span className="font-semibold">Địa chỉ:</span> {curentData?.address}
                    </p>

                    <p className="text-base">
                        <span className="font-semibold">SĐT:</span> {curentData?.phone}
                    </p>

                    {/* <p className="text-sm">
                        <span className="font-semibold">STK công ty:</span> {curentData.stk_2}
                    </p>
                    <p className="text-sm">
                        <span className="font-semibold">STK cá nhân:</span> {curentData.stk_1}
                    </p> */}
                </div>
            </div>
        );
    };

    const columns: ColumnsType = [
        {
            title: 'STT',
            dataIndex: 'stt',
            key: 'stt',
            align: 'center',
            render: (text, record, index) =>
                record.isSummary
                    ? {
                          children: <div style={{ fontWeight: 600, textAlign: 'right', paddingRight: 8 }}>{record.label}</div>,
                          props: { colSpan: hasWeight ? 6 : 5, style: { fontWeight: 600, textAlign: 'right' } },
                      }
                    : index + 1,
        },
        {
            title: 'Tên Hàng',
            dataIndex: 'productName',
            key: 'productName',
            render: (text, record) =>
                record.isSummary ? (
                    { children: null, props: { colSpan: 0 } }
                ) : (
                    <span>
                        {text} {!!record?.description && <span className="italic">{`( ${record?.description} )`}</span>}
                    </span>
                ),
        },
        {
            title: 'ĐVT',
            dataIndex: 'unit',
            key: 'unit',
            align: 'center',
            render: (text, record) => (record.isSummary ? { children: null, props: { colSpan: 0 } } : text),
        },
        {
            title: 'SL',
            dataIndex: 'quantity',
            key: 'quantity',
            align: 'center',
            render: (text, record) => (record.isSummary ? { children: null, props: { colSpan: 0 } } : text),
        },
        ...(hasWeight
            ? [
                  {
                      title: 'TL',
                      dataIndex: 'weight',
                      key: 'weight',
                      align: 'center' as const,
                      render: (text: any, record: any) => (record.isSummary ? { children: null, props: { colSpan: 0 } } : text),
                  },
              ]
            : []),
        {
            title: 'Đơn giá',
            dataIndex: 'sellingPrice',
            key: 'sellingPrice',
            align: 'right',
            render: (value, record) => (record.isSummary ? { children: null, props: { colSpan: 0 } } : value?.toLocaleString()),
        },
        {
            title: 'Thành tiền',
            dataIndex: 'total',
            key: 'total',
            align: 'right',
            render: (_, record) =>
                record.isSummary
                    ? {
                          children: typeof record.value === 'number' ? record.value.toLocaleString() : record.value,
                          props: { colSpan: 1, style: { fontWeight: 600 } },
                      }
                    : (record?.sellingPrice * record?.quantity * record?.weight).toLocaleString(),
        },
    ];

    const totalRaw = details?.reduce((sum, item) => sum + item?.quantity * item?.sellingPrice * item?.weight, 0);

    const summaryData = [
        { key: '1', isSummary: true, label: 'PHÍ VẬN CHUYỂN:', value: deliveryFee, show: deliveryFee !== 0 },
        { key: '2', isSummary: true, label: 'CHIẾT KHẤU:', value: discount, show: discount !== 0 },
        { key: '3', isSummary: true, label: 'TỔNG ĐƠN HÀNG:', value: totalRaw, show: true },
        { key: '4', isSummary: true, label: 'NỢ CŨ:', value: previousDebt || '................', show: true },
        {
            key: '5',
            isSummary: true,
            label: 'TỔNG CỘNG:',
            value: totalAmount,
            show: true,
        },
        { key: '6', isSummary: true, label: 'ĐÃ THANH TOÁN:', value: totalAmountPaid || 0, show: true },
        {
            key: '7',
            isSummary: true,
            label: 'CÒN LẠI:',
            value: (totalAmount ?? 0) - (totalAmountPaid ?? 0),
            show: true,
        },
    ].filter(item => item?.show);

    return (
        <div ref={ref} className="invoice-print p-1 bg-white rounded-lg w-full">
            <InvoiceHeader />
            <div className="text-end text-base">
                Số: <strong>{code}</strong>
            </div>
            <h2 className="text-3xl font-bold mb-3 text-center">Hóa đơn bán hàng</h2>

            <div className="flex gap-20 text-base">
                <p>
                    Khách hàng: <span className="font-semibold">{customerName}</span>
                </p>
                <p>SĐT: {phone}</p>
            </div>
            <p className="text-base">Địa chỉ: {address}</p>

            <Table
                columns={columns}
                dataSource={details?.concat(summaryData as any)}
                pagination={false}
                bordered
                size="middle"
                className="mt-3 !text-xl"
            />

            <div className="flex justify-between items-start mt-3">
                <div className="text-base">
                    <p>Quý khách thanh toán Tiền Mặt hoặc Chuyển Khoản theo thông tin sau:</p>
                    <p className="font-semibold">STK cá nhân: {curentData.stk_1}</p>
                    <p className="font-semibold">STK công ty: {curentData.stk_2}</p>
                    <div className="mt-2 text-base text-end">
                        {invoiceDate
                            ? moment(invoiceDate).format('[Ngày] DD [tháng] MM [năm] YYYY')
                            : moment().format('[Ngày] DD [tháng] MM [năm] YYYY')}
                    </div>

                    <div className="flex justify-between text-base mt-2 px-10">
                        <span className="font-semibold">Người nhận</span>
                        <span className="font-semibold">Người giao</span>
                    </div>
                </div>

                <div className="flex-shrink-0 text-end ml-2">
                    <img src={curentData.qr} alt="QR Code" className="inline-block w-28 h-28" />
                </div>
            </div>
        </div>
    );
});

InvoicePrintContent.displayName = 'InvoicePrintContent';

export default InvoicePrintContent;
