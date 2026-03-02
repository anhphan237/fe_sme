/**
 * BaseButton — icon + translated label button (ported from PMS)
 */
import { Button } from "antd";
import type { ButtonProps } from "antd";
import { useIntl } from "react-intl";
import type { ReactNode } from "react";

interface BaseButtonProps extends ButtonProps {
  label?: string;
  icon?: ReactNode;
}

const BaseButton = ({
  className,
  icon,
  label = "",
  ...rest
}: BaseButtonProps) => {
  const intl = useIntl();

  const text = label
    ? intl.messages[label]
      ? intl.formatMessage({ id: label })
      : label
    : "";

  return (
    <Button className={className} icon={undefined} {...rest}>
      <div className="flex gap-2 justify-center items-center">
        {icon}
        {text}
      </div>
    </Button>
  );
};

export default BaseButton;
