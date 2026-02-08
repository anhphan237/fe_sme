import { apiSearchUsers } from '@/api/user.api';
import InfiniteScrollSelect from '@/core/components/Select/InfinitieScroll';
import BaseTextArea from '@/core/components/TextArea/BaseTextArea';
import { useLocale } from '@/i18n';
import BaseModal, { BaseModalProps } from '@core/components/Modal/BaseModal';
import { Button, Form } from 'antd';
import React, { forwardRef, isValidElement, useImperativeHandle, useState } from 'react';

import usePromiseHolder from '@/hooks/usePromiseHolder';

interface Result {
    code: number;
    message?: string;
    description?: string;
    approverUserId?: string;
}

export interface RequestApproveModalHandles {
    open: () => Promise<Result>;
}

export const REQUEST_APPROVE_CODE = {
    CONFIRMED: 200,
    CANCELED: -1,
} as const;
export type REQUEST_APPROVE_CODE = (typeof REQUEST_APPROVE_CODE)[keyof typeof REQUEST_APPROVE_CODE];

interface RequestApproveModalProps extends Omit<BaseModalProps, 'onConfirm' | 'onCancel'> {
    message?: React.ReactNode;
}

const RequestApproveModal = forwardRef<RequestApproveModalHandles, RequestApproveModalProps>((props, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [submittable, setSubmittable] = React.useState<boolean>(false);

    const { execute, resolve, reject } = usePromiseHolder<Result>({
        defaultValue: { code: -1, message: 'unknown' },
    });
    const { t } = useLocale();
    const [form] = Form.useForm();

    const values = Form.useWatch([], form);

    React.useEffect(() => {
        form.validateFields({ validateOnly: true })
            .then(() => setSubmittable(true))
            .catch(() => setSubmittable(false));
    }, [form, values]);

    useImperativeHandle(ref, () => ({
        open: () => {
            setIsOpen(true);
            return execute();
        },
    }));

    const handleReset = () => {
        setIsOpen(false);
        form.resetFields();
    };

    const handleConfirm = async () => {
        const values = await form.validateFields();
        resolve({
            code: REQUEST_APPROVE_CODE.CONFIRMED,
            description: values?.description || '',
            approverUserId: values?.approverUserId || '',
            message: 'Confirmed',
        });
        handleReset();
    };

    const handleCancel = () => {
        reject({ code: REQUEST_APPROVE_CODE.CANCELED, message: 'Canceled' });
        handleReset();
    };

    const renderDescription = () => {
        const result = props.message;
        return result && isValidElement(result) ? React.cloneElement(result) : result || '';
    };

    return (
        <BaseModal
            rootClassName="confirm-modal"
            closable={false}
            centered
            open={isOpen}
            onCancel={handleCancel}
            onClose={handleCancel}
            footer={null}
            {...props}
        >
            <Form form={form} initialValues={{}} name="quotation-sale-request" layout="horizontal" autoComplete="off">
                <p className="text-gray-600 text-center mb-4 font-bold">{renderDescription()}</p>
                <InfiniteScrollSelect
                    placeholder={t('sales.approver')}
                    queryKey={['getListUsers']}
                    name="approverUserId"
                    formItemProps={{
                        required: true,
                        rules: [{ required: true, message: t('global.message.required_field') }],
                    }}
                    showSearch
                    fetchData={async ({ pageNumber, pageSize, search }) => {
                        const res = await apiSearchUsers(pageNumber, pageSize, search, { loading: false });
                        return res.data;
                    }}
                />
                <BaseTextArea
                    className="mt-4"
                    name="description"
                    placeholder={t('sales.confirm.description.placeholder')}
                    formItemProps={{
                        rules: [{ max: 255, message: t('global.message.max_length', { length: 255 }) }],
                    }}
                    rows={4}
                />
                <div className="flex justify-between mt-4">
                    <Button className="w-[calc(50%_-_8px)]" disabled={!submittable} htmlType="submit" type="primary" onClick={handleConfirm}>
                        {t('global.confirm')}
                    </Button>
                    <Button className="w-[calc(50%_-_8px)]" onClick={handleCancel}>
                        {t('global.cancel')}
                    </Button>
                </div>
            </Form>
        </BaseModal>
    );
});

export default RequestApproveModal;
