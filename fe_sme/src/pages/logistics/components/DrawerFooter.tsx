import { useLocale } from '@/i18n';
import { Button } from 'antd';
import { isValidElement } from 'react';

import BaseButton, { Props as BaseButtonProps } from '@/components/button';

const DrawerFooter = ({
    title,
    applyBtnProps,
    cancelBtnProps,
    onCancel,
    onOk,
}: {
    title?: React.ReactNode;
    applyBtnProps?: BaseButtonProps;
    cancelBtnProps?: BaseButtonProps;
    onCancel: () => void;
    onOk: () => void;
}) => {
    const { t } = useLocale();
    const renderTitle = () => {
        if (isValidElement(title)) {
            return title;
        } else if (title) {
            return <h3 className="text-lg font-bold mb-2">{title}</h3>;
        }
        return null;
    };
    return (
        <>
            {renderTitle()}
            <Button.Group className="flex gap-2">
                <BaseButton onClick={onCancel} className="w-1/2" type="default" label={t('global.cancel')} {...cancelBtnProps} />
                <BaseButton onClick={onOk} type="primary" className="w-1/2" label={t('global.apply')} {...applyBtnProps} />
            </Button.Group>
        </>
    );
};

export default DrawerFooter;
