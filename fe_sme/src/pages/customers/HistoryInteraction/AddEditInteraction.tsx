import { apiAddHistoryInteraction, apiSearchCustomerInfo, apiUpdateHistoryInteraction } from '@/api/customer.api';
import { apiSearchUsers } from '@/api/user.api';
import BaseDatePicker from '@/core/components/DatePicker';
import BaseInput from '@/core/components/Input/InputWithLabel';
import BaseSelect from '@/core/components/Select/BaseSelect';
import InfiniteScrollSelect from '@/core/components/Select/InfinitieScroll';
import BaseTextArea from '@/core/components/TextArea/BaseTextArea';
import { useLocale } from '@/i18n';
import { Drawer, Form } from 'antd';
import { isEmpty } from 'lodash';
import { useRef } from 'react';

import DrawerFooter from '@/pages/sales/components/DrawerFooter';

import { notify } from '@/components/toast-message';

import { convertTimeToInput } from '@/utils/format-datetime';

import { UserCustomer } from '@/interface/sales';

interface IProps {
    initValue: any;
    onClose: () => void;
    canEdit: boolean;
}

const AddEditInteraction = (props: IProps) => {
    const { initValue, onClose, canEdit } = props;

    const { t } = useLocale();
    const [form] = Form.useForm();
    const confirmRef = useRef<any>(null);

    const isEdit = !isEmpty(initValue);

    const onSubmit = async () => {
        const values = await form.validateFields();
        const res = isEdit ? await apiUpdateHistoryInteraction({ ...values, id: initValue.id }) : await apiAddHistoryInteraction(values);
        if (res.succeeded) {
            notify.success(isEdit ? t('message.update_success') : t('message.add_success'));
            onClose();
        } else notify.error(t('message.failed'));
    };

    return (
        <>
            <Drawer
                title={isEdit ? t('history.interaction.edit') : t('history.interaction.add')}
                placement="right"
                open={!!initValue}
                onClose={onClose}
                closable={false}
                maskClosable={false}
                destroyOnClose
                width={550}
                styles={{
                    body: { padding: 16 },
                }}
                style={{ zIndex: 1200 }}
                footer={<DrawerFooter applyBtnProps={{ label: t('global.save'), disabled: !canEdit }} onCancel={onClose} onOk={onSubmit} />}
            >
                <Form
                    name="form-interaction"
                    layout="vertical"
                    rootClassName="relative"
                    className="w-full h-[calc(100vh_-_94px)] flex flex-col gap-4 bg-white rounded-lg overflow-auto"
                    autoComplete="off"
                    form={form}
                    disabled={!canEdit}
                    initialValues={{
                        ...initValue,
                        interactionDate: initValue?.interactionDate ? convertTimeToInput(initValue?.interactionDate) : null,
                    }}
                    preserve
                    clearOnDestroy
                >
                    <InfiniteScrollSelect
                        name="customerId"
                        queryKey={['getCustomers']}
                        label={t('sales.customer')}
                        placeholder={t('sales.customer')}
                        formItemProps={{
                            rules: [{ required: true, message: t('sales.customer.required') }],
                            required: true,
                            labelAlign: 'left',
                        }}
                        showSearch
                        labelRender={item => item.label ?? initValue?.customer?.name}
                        fetchData={async ({ pageNumber, pageSize, search }) => {
                            const res = await apiSearchCustomerInfo({ pageNumber, pageSize, search }, { loading: false });
                            return res.data;
                        }}
                        mapData={(data: UserCustomer[]) =>
                            data.map((item: UserCustomer) => ({
                                ...item,
                                label: item.nameShort ?? item.name ?? '',
                                value: item.id,
                            }))
                        }
                    />
                    <BaseDatePicker
                        name="interactionDate"
                        label={t('history.date')}
                        className="w-full"
                        showTime
                        format="YYYY-MM-DD HH:mm"
                        placeholder={t('history.date')}
                        formItemProps={{ rules: [{ required: true, message: t('global.message.required_field') }] }}
                    />
                    <BaseSelect
                        options={[
                            {
                                value: 0,
                                label: t('global.email'),
                            },
                            {
                                value: 1,
                                label: t('history.call'),
                            },
                            {
                                value: 2,
                                label: t('history.direct'),
                            },
                        ]}
                        name="channel"
                        label={t('history.channel')}
                        placeholder={t('history.channel')}
                        formItemProps={{ rules: [{ required: true, message: t('global.message.required_field') }] }}
                    />
                    <BaseInput name="subject" label={t('finance_accounting.content')} placeholder={t('finance_accounting.content')} />
                    <BaseTextArea name="description" label={t('global.description')} placeholder={t('global.description')} />
                    <InfiniteScrollSelect
                        label={t('logistics.enter_warehouse.exporter')}
                        placeholder={t('logistics.enter_warehouse.exporter')}
                        queryKey={['getListUsersFromEnter']}
                        name="userId"
                        formItemProps={{
                            rules: [{ required: true, message: t('global.message.required_field') }],
                            required: true,
                            labelAlign: 'left',
                        }}
                        showSearch
                        labelRender={item => item.label ?? initValue?.personInCharge?.userName}
                        fetchData={async ({ pageNumber, pageSize, search }) => {
                            const resp = await apiSearchUsers(pageNumber, pageSize, search, { loading: false });
                            return resp.data;
                        }}
                    />
                    <BaseSelect
                        options={[
                            {
                                value: 0,
                                label: t('history.pendding'),
                            },
                            {
                                value: 1,
                                label: t('history.waiting_for_response'),
                            },
                            {
                                value: 2,
                                label: t('history.processed'),
                            },
                        ]}
                        name="status"
                        label={t('global.status')}
                        placeholder={t('global.status')}
                        formItemProps={{ rules: [{ required: true, message: t('global.message.required_field') }] }}
                    />
                </Form>
            </Drawer>
        </>
    );
};

export default AddEditInteraction;
