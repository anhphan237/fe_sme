import BaseFormItem from "@core/components/Form/BaseFormItem";
import {
  InputNumber,
  Tooltip,
  type InputNumberProps,
  type TooltipProps,
} from "antd";
import type { NamePath } from "antd/es/form/interface";
import type { FormItemProps } from "antd/lib";

import React from "react";

export interface InputNumberWithLabelProps extends InputNumberProps {
  name: NamePath;
  label?: React.ReactNode;
  formItemProps?: FormItemProps;
  isMoneyFormat?: boolean;
  isNumberFormat?: boolean;
  tooltipProps?: TooltipProps;
  isMasked?: boolean;
}

const BlankInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);
const TooltipInputWrapper = ({
  children,
  tooltipProps,
}: {
  children: React.ReactNode;
  tooltipProps?: TooltipProps;
}) => (
  <Tooltip trigger={["focus"]} placement="topLeft" {...tooltipProps}>
    {children}
  </Tooltip>
);

const BaseInputNumber = ({
  name,
  label,
  formItemProps,
  addonAfter,
  isMoneyFormat,
  isNumberFormat,
  tooltipProps,
  isMasked,
  ...props
}: InputNumberWithLabelProps) => {
  const moneyFormatter = (value: number | string | undefined) => {
    if (isMasked) return "***";
    if (value === undefined || value === null || isNaN(Number(value)))
      return "";
    const [integer, decimal] = String(value).split(".");
    return (
      `${integer}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
      (decimal ? `.${decimal}` : "")
    );
  };

  const moneyParser = (value: string | undefined) =>
    value?.replace(/\$\s?|(,*)/g, "") || "";

  const renderAddonAfter = () => {
    if (addonAfter || addonAfter === null) {
      return addonAfter;
    }
    return isMoneyFormat ? "VND" : undefined;
  };

  const InputWrapper = tooltipProps ? TooltipInputWrapper : BlankInputWrapper;
  return (
    <InputWrapper tooltipProps={tooltipProps}>
      <BaseFormItem label={label} name={name} {...formItemProps}>
        <InputNumber
          controls={false}
          max={1000000000000}
          {...props}
          className="w-full"
          formatter={
            isMoneyFormat || isNumberFormat ? moneyFormatter : props.formatter
          }
          parser={isMoneyFormat || isNumberFormat ? moneyParser : props.parser}
          addonAfter={renderAddonAfter()}
        />
      </BaseFormItem>
    </InputWrapper>
  );
};

export default BaseInputNumber;
