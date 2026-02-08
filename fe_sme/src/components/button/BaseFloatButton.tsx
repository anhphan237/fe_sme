import { FloatButton } from 'antd';
import { FloatButtonProps } from 'antd/lib';
import React from 'react';

export type Props = FloatButtonProps & {
    title?: string;
    disabled?: boolean;
};

const BaseFloatButton: React.FC<Props> = ({ className, tooltip, title, disabled, children, ...rest }) => {
    if(disabled) {
        return null;
    }
    return (
        <FloatButton className={className} tooltip={tooltip ?? title} {...rest}>
            {children}
        </FloatButton>
    );
};

export default BaseFloatButton;
