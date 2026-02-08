import { faAnchor } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FloatButton } from 'antd';
import React from 'react';

const RightControl = ({ children }: { children: React.ReactNode }) => {
    return (
        <FloatButton.Group
            trigger="hover"
            type="primary"
            style={{ insetBlockEnd: 128, insetInlineEnd: 8 }}
            icon={<FontAwesomeIcon icon={faAnchor} />}
        >
            {children}
        </FloatButton.Group>
    );
};

export default RightControl;
