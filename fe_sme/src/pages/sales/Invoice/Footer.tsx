import { apiExport } from "@/api/file.api";
import { AppRouters } from "@/constants";
import BaseInputNumber from "@/core/components/Input/BaseNumberInput";
import { COMMON_STATUS } from "@/core/components/Status/PaymentTag";
import { useLocale } from "@/i18n";
import { faDownload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Col, Form, Row, Typography } from "antd";
import { useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

import BaseButton from "@/components/button";
import { notify } from "@/components/toast-message";

import { FileHelper, InputHelper, formatMoney } from "@/utils/helpers";

import QuickPay from "../components/QuickPay";
import { Helper, sellingPriceByItem } from "../utils";

const { Text } = Typography;
const AddOrEditFooter = ({
  refetch,
  handleQuickRefund,
}: {
  refetch: () => void;
  handleQuickRefund?: () => void;
}) => {
  const { t } = useLocale();
  const { id } = useParams<{ id: string }>();
  const form = Form.useFormInstance();
  const navigate = useNavigate();
  const isEdit = !!id && id !== "add";
  const products = Form.useWatch("details", { form, preserve: true }) || [];
  const customer = Form.useWatch("customer", { form, preserve: true }) || [];
  const deliveryFee =
    Form.useWatch("deliveryFee", { form, preserve: true }) || 0;
  const status = Form.useWatch("status", { form, preserve: true });
  const discount =
    Form.useWatch("discountAmount", { form, preserve: true }) || 0;
  const previousDebt =
    Form.useWatch("previousDebt", { form, preserve: true }) || 0;
  const debtDocumentId = Form.useWatch("debtDocumentId", {
    form,
    preserve: true,
  });
  const totalAmount = Form.useWatch("totalAmount", { form, preserve: true });
  const totalAmountPaid = Form.useWatch("totalAmountPaid", {
    form,
    preserve: true,
  });
  const invoiceDate = Form.useWatch("invoiceDate", { form, preserve: true });
  const { totalQuantity } = Helper.sumUp(products);
  const quickPayRef = useRef<any>(null);

  const actualMoney =
    products?.reduce(
      (sum: number, item: { costPrice: number; quantity: number }) => {
        const price = sellingPriceByItem(item, "sale") || 0;
        return sum + price;
      },
      0,
    ) || 0;
  const totalPrice = actualMoney + deliveryFee + previousDebt - discount;

  const handleExit = () => {
    navigate(AppRouters.INVOICE);
  };

  const handleExportOrder = async () => {
    try {
      const response = await apiExport({ path: "invoice", invoiceId: id });
      await FileHelper.downloadFileFromResponse(response as any);
      notify.success(t("global.message.export_success"));
    } catch (error) {
      notify.error("global.message.export_failed");
    }
  };

  const handleQuickPay = async () => {
    try {
      await quickPayRef?.current?.open({
        debtDocumentId,
        invoiceDate,
        remainingAmount: totalAmount - totalAmountPaid,
        isEditMode: isEdit,
      });
      refetch();
    } catch (error) {}
  };

  return (
    <>
      <Row
        align="bottom"
        gutter={[16, 8]}
        className="w-full col-span-6 sticky bottom-0 px-4 py-2 left-0 bg-white z-10 border-t border-gray-200">
        <Col span={12}>
          <Text className="text-right whitespace-nowrap text-lg font-semibold">{`${t("sales.total_product")}: `}</Text>
          <Text className={`font-bold text-xl`}>
            {totalQuantity ? InputHelper.formatNumber(totalQuantity) : 0}
          </Text>
        </Col>

        <Col span={12} className="text-right">
          <Text className="text-right whitespace-nowrap text-lg font-semibold">{`${t("sales.total_price")}: `}</Text>
          <Text className={`font-bold text-xl`}>{formatMoney(totalPrice)}</Text>
        </Col>
        <Col span={5} className="relative">
          <BaseInputNumber
            label={t("sales.shipping_fee")}
            placeholder={t("sales.shipping_fee")}
            name="deliveryFee"
            isMoneyFormat
            formItemProps={{
              wrapperCol: { span: 24 },
            }}
          />
        </Col>
        <Col span={5}>
          <BaseInputNumber
            label={t("sales.discount")}
            placeholder={t("sales.discount")}
            name="discountAmount"
            isMoneyFormat
            formItemProps={{
              wrapperCol: { span: 24 },
            }}
          />
        </Col>

        <Col span={5}>
          <BaseInputNumber
            label={t("sales.old_debt")}
            placeholder={t("sales.old_debt")}
            name="previousDebt"
            min={0}
            isMoneyFormat
            formItemProps={{
              wrapperCol: { span: 24 },
            }}
          />
        </Col>
        <Col
          span={9}
          className="flex justify-end items-center pt-2 col-span-5 gap-2">
          <BaseButton
            label={t("global.back")}
            disabled={false}
            onClick={handleExit}
          />
          <BaseButton
            type="primary"
            label={t("finance_accounting.refund")}
            onClick={handleQuickRefund}
            disabled={[COMMON_STATUS.CANCELLED].includes(status)}
          />
          <BaseButton
            type="primary"
            label={t("sales.quick_pay")}
            disabled={
              ![COMMON_STATUS.PENDING, COMMON_STATUS.PROCESSING].includes(
                status,
              )
            }
            onClick={handleQuickPay}
          />
          <BaseButton
            label={t("sales.export_invoice")}
            type="primary"
            icon={<FontAwesomeIcon icon={faDownload} />}
            disabled={[COMMON_STATUS.REFUNDED].includes(status)}
            onClick={handleExportOrder}
          />
        </Col>
      </Row>
      <QuickPay
        ref={quickPayRef}
        data={{
          customerName: customer?.customerName,
          address: customer?.customerAddress,
          phone: customer?.customerPhone,
          code: form.getFieldValue("orderCode"),
          details: products,
          previousDebt: previousDebt,
          deliveryFee: deliveryFee,
          discount: discount,
          totalAmount: form.getFieldValue("totalAmount"),
          invoiceDate: invoiceDate,
          totalAmountPaid: totalAmountPaid,
        }}
      />
    </>
  );
};

export default AddOrEditFooter;
