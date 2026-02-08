import { formatNumber } from '@/utils/helpers';

import logo from '@assets/logo/exps.png';

import { ProductItem } from '@/interface/sales';

type _T_Props = {
    data: ProductItem[];
};

export default function TemplateSales({ data }: _T_Props) {
    const totalQuantity = data.reduce((sum, item) => sum + item.quantity, 0);
    const totalWeight = data.reduce((sum, item) => sum + item.weightActual, 0);

    return (
        <div className="w-full bg-white text-black p-2">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="font-bold uppercase">CÔNG TY CỔ PHẦN THƯƠNG MẠI THÉP TRẦN LONG</h1>
                    <p>Add: 358 Ngô Gia Tự, phường Việt Hưng, Hà Nội</p>
                    <p>Hotline: 097.322.1279 - 077.229.5555</p>
                    <p>
                        Website: <span className="underline">https://theptranlong.com/</span>
                    </p>
                    <p>STK1: 1110.0296.5900 tại NH VietinBank – CN Thăng Long</p>
                    <p>STK2: 21410.469238 tại NH BIDV – CN Đông Hà Nội</p>
                </div>

                <div className="flex flex-col items-center">
                    <div className="w-28 h-28 border rounded-full flex items-center justify-center font-bold">
                        <img src={logo} alt="logo" className="size-full object-cover" />
                    </div>
                </div>
            </div>
            <div className="text-center mt-2">
                <h2 className="font-bold">BIÊN BẢN GIAO NHẬN HÀNG HÓA</h2>
                <p className="italic">(Kiêm giấy nhập nợ)</p>
                <p className="mt-2 text-right">Hà Nội, ngày 29 tháng 11 năm 2025</p>
            </div>
            <div className="p-2">
                <p>
                    Theo đơn hàng số: <b>{'{AUTO}'}</b>
                </p>
                <p>
                    Xuất từ kho: <b>{'{AUTO}'}</b>
                </p>
                <p>
                    Địa điểm giao nhận: <b className="text-red-500">{'{AUTO}/tự nhập'}</b>
                </p>
            </div>
            <div className="grid grid-cols-2 border border-stone-400 p-1">
                <div className="p-2">
                    <p className="font-bold">BÊN NHẬN HÀNG:</p>
                    <p>
                        Người nhận hàng: <b>{'{AUTO}'}</b>
                    </p>
                    <p>Chức vụ: ________</p>
                    <p>SĐT: ________</p>
                    <p>Số CCCD: ________</p>
                </div>
                <div className="p-2">
                    <p className="font-bold">ĐƠN VỊ VẬN TẢI</p>
                    <p>Họ và tên lái xe: ________</p>
                    <p>Biển số xe: ________</p>
                    <p>Số CCCD: ________</p>
                    <p>Số điện thoại: ________</p>
                </div>
            </div>
            <h3 className="font-bold mt-4 mb-2">DANH MỤC HÀNG HÓA</h3>

            <table className="w-full border border-stone-400">
                <thead>
                    <tr className="bg-blue-100 text-center">
                        <th className="border border-stone-400 p-2">STT</th>
                        <th className="border border-stone-400 p-2 min-w-48">Tên và quy cách hàng hóa</th>
                        <th className="border border-stone-400 p-2 min-w-20">Barem SX</th>
                        <th className="border border-stone-400 p-2 min-w-20">Số lượng (pcs)</th>
                        <th className="border border-stone-400 p-2 min-w-28">Khối lượng ước tính (kg)</th>
                        <th className="border border-stone-400 p-2 min-w-20">Đơn giá (VNĐ)</th>
                        <th className="border border-stone-400 p-2 min-w-24">Thành tiền</th>
                        <th className="border border-stone-400 p-2 min-w-20">Giá tính theo</th>
                        <th className="border border-stone-400 p-2 min-w-20">Xuất xứ</th>
                        <th className="border border-stone-400 p-2 min-w-20">Mác thép</th>
                        <th className="border border-stone-400 p-2 min-w-20">Ghi chú</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, i) => {
                        const totalMoney = item.quantity * item.sellingPrice;
                        return (
                            <tr key={item.id}>
                                <td className="border border-stone-400 p-1 text-center">{i + 1}</td>
                                <td className="border border-stone-400 p-1">{item.productName}</td>
                                <td className="border border-stone-400 p-1 text-center">{formatNumber(item.weightDeviation)}</td>
                                <td className="border border-stone-400 p-1 text-center">{formatNumber(item.quantity)}</td>
                                <td className="border border-stone-400 p-1 text-center">{formatNumber(item.weightActual)}</td>
                                <td className="border border-stone-400 p-1 text-center">{item.sellingPrice.toLocaleString()}</td>
                                <td className="border border-stone-400 p-1 text-center">{totalMoney.toLocaleString()}</td>
                                <td className="border border-stone-400 p-1 text-center">{item.unit}</td>
                                <td className="border border-stone-400 p-1 text-center">{item.productOrigin}</td>
                                <td className="border border-stone-400 p-1 text-center">{item.mac}</td>
                                <td className="border border-stone-400 p-1">{item.description}</td>
                            </tr>
                        );
                    })}
                    <tr className="bg-blue-100 font-bold text-center">
                        <td className="border border-stone-400 p-1" colSpan={3}>
                            TỔNG CỘNG
                        </td>
                        <td className="border border-stone-400 p-1">{formatNumber(totalQuantity)}</td>
                        <td className="border border-stone-400 p-1">{formatNumber(totalWeight)}</td>
                        <td className="border border-stone-400 p-1"></td>
                        <td className="border border-stone-400 p-1"></td>
                        <td className="border border-stone-400 p-1"></td>
                        <td className="border border-stone-400 p-1"></td>
                        <td className="border border-stone-400 p-1"></td>
                        <td className="border border-stone-400 p-1"></td>
                    </tr>
                </tbody>
            </table>
            <p className="mt-2 italic text-red-500 text-center">(Đã bao gồm thuế GTGT)</p>
            <div className="mt-4 ">
                <p>
                    <span className="inline-block min-w-56 text-right">Số tiền đã cọc:</span> <b>{'{AUTO}'}</b>
                </p>
                <p>
                    <span className="inline-block min-w-56 text-right">Còn lại:</span> <b>{'{AUTO}'}</b>
                </p>
                <p>
                    <span className="inline-block min-w-56 text-right">Số tiền viết bằng chữ:</span> <b>{'{AUTO}'}</b>
                    <span className="italic"> (số tiền bằng chữ in nghiêng)</span>
                </p>
                <div className="mt-2 flex">
                    <p className="min-w-56 text-right"> Bằng biên bản này chúng tôi xác nhận:</p>
                    <div>
                        <p>- Đã nhận đủ số lượng hàng theo bảng trên</p>
                        <p>- Đã kiểm tra đúng quy cách chất lượng</p>
                        <p>- Không có khiếu nại tại thời điểm nhận hàng</p>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-3 text-center mt-10">
                <div>
                    <p className="font-bold">Người giao hàng</p>
                    <p className="italic">(Ký, họ tên)</p>
                </div>
                <div>
                    <p className="font-bold">Đơn vị vận chuyển</p>
                    <p className="italic">(Ký, họ tên)</p>
                </div>
                <div>
                    <p className="font-bold">Người nhận hàng</p>
                    <p className="italic">(Ký, họ tên)</p>
                </div>
            </div>
        </div>
    );
}
