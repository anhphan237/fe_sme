import { useLocale } from "@/i18n";
import Button from "antd/es/button";
import type { ButtonProps } from "antd/es/button";
import React from "react";

export type Props = ButtonProps & { label?: string };

const BaseButton: React.FC<Props> = ({
  className,
  icon,
  label = "",
  children,
  ...rest
}) => {
  const { t } = useLocale();
  const content = label ? t(label) : children;
  return (
    <Button className={className} {...rest}>
      <div className="flex gap-2 justify-center items-center">
        {icon}
        {content}
      </div>
    </Button>
  );
};

export default BaseButton;
