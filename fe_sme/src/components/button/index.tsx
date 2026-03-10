import { useLocale } from "@/i18n";
import Button from "antd/es/button";
import type { ButtonProps } from "antd/es/button";
import React from "react";

export type Props = ButtonProps & { label?: string };

const BaseButton: React.FC<Props> = ({
  className,
  icon,
  label = "",
  ...rest
}) => {
  const { t } = useLocale();
  return (
    <Button className={className} {...rest}>
      <div className="flex gap-2 justify-center items-center">
        {icon}
        {t(label)}
      </div>
    </Button>
  );
};

export default BaseButton;
