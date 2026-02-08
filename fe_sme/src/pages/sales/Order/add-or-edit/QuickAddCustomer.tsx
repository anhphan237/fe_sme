import { apiSearchCustomerType } from '@/api/category.api';
import { apiAddCustomerInfo } from '@/api/customer.api';
import { apiSearchUsers } from '@/api/user.api';
import { AppRouters, DefaultMappingPermission, RegexValidate } from '@/constants';
import BaseInput from '@/core/components/Input/InputWithLabel';
import InfiniteScrollSelect from '@/core/components/Select/InfinitieScroll';
import { useLocale } from '@/i18n';
import { Drawer, Form } from 'antd';

import BaseButton from '@/components/button';
import { notify } from '@/components/toast-message';

import useCheckIsFullPermission from '@/hooks/useCheckIsFullPermission';

import { handleCommonError } from '@/utils/helpers';

import { IAddEditCustomerInfo } from '@/interface/customer';

interface IProps {
    open: boolean;
    onClose: () => void;
}

const QuickAddCustomer = ({ onClose, open }: IProps) => {
    const { t } = useLocale();
    const [form] = Form.useForm();
    const isFullPermission = useCheckIsFullPermission(DefaultMappingPermission[AppRouters.CUSTOMER_INFO]);

    const handleAddEdit = async (data: any) => {
        try {
            const params: IAddEditCustomerInfo = {
                customerTypeId: data.customerTypeId,
                name: data.name,
                nameShort: data.nameShort,
                phone: data.phone,
                email: data.email,
                address: data.address,
                description: data.description,
                taxCode: data.taxCode,
                customerPersonInCharge: data.customerPersonInCharge?.userId
                    ? {
                          userId: data.customerPersonInCharge.userId,
                      }
                    : undefined,
                customerContactPersons: data.customerContactPersons?.map((item: any, index: number) => ({
                    name: item.name,
                    phone: item.phone,
                    position: item.position,
                    description: item.description,
                    number: index + 1,
                })),
                customerBankAccounts: data.customerBankAccounts?.map((item: any, index: number) => ({
                    bankAccountName: item.bankAccountName,
                    bankAccountNumber: item.bankAccountNumber,
                    bankName: item.bankName,
                    bankBranch: item.bankBranch,
                    description: item.description,
                    number: index + 1,
                })),
            };

            const res = await apiAddCustomerInfo(params);

            if (res.succeeded) {
                notify.success(t('message.add_success'));
                onClose();
            } else {
                throw res;
            }
        } catch (error: any) {
            handleCommonError(error, t);
        }
    };

    const getPositionNames = (user: any) => user.positions?.map((p: any) => p.name || p.positionName || p.id)?.join(', ') || '';

    return (
        <Drawer
            open={open}
            onClose={onClose}
            destroyOnClose
            title={t('customer.add')}
            width={460}
            footer={
                <div className="flex justify-end items-center pt-2 col-span-6 gap-2">
                    <BaseButton label={t('global.popup.reject')} onClick={onClose} disabled={false} />
                    <BaseButton label={t('global.popup.save')} type="primary" htmlType="submit" form="formCustomer" />
                </div>
            }
        >
            <Form
                name="form-customer-profile-v2"
                id="formCustomer"
                layout="vertical"
                className="w-full flex flex-col gap-4 bg-white rounded-lg overflow-auto"
                onFinish={handleAddEdit}
                autoComplete="off"
                form={form}
                onKeyDown={e => {
                    if (e.key === 'Enter') e.preventDefault();
                }}
                initialValues={{
                    customerPersonInCharge: { userId: undefined },
                    customerContactPersons: [],
                    customerBankAccounts: [],
                }}
                preserve
                clearOnDestroy
                disabled={!isFullPermission}
            >
                <InfiniteScrollSelect
                    name="customerTypeId"
                    queryKey={['getListCustomerTypev3']}
                    label={t('customer.type')}
                    placeholder={t('customer.type')}
                    labelRender={value => value?.label ?? form.getFieldValue('customerTypeName')}
                    formItemProps={{
                        rules: [{ required: true, message: t('customer.type.required') }],
                        required: true,
                    }}
                    showSearch
                    fetchData={async ({ pageNumber, pageSize, search }) => {
                        const resp = await apiSearchCustomerType({ pageNumber, pageSize, search }, { loading: false });
                        return resp.data;
                    }}
                />
                <BaseInput
                    label={t('customer.name')}
                    placeholder={t('customer.name')}
                    name="name"
                    onChange={e => form.setFieldValue('nameShort', e.target.value)}
                    formItemProps={{
                        required: true,
                        rules: [{ required: true, message: t('customer.name.required') }],
                        className: 'col-span-1',
                    }}
                />

                <BaseInput
                    label={t('customer.phone')}
                    placeholder={t('customer.phone')}
                    name="phone"
                    formItemProps={{
                        required: true,
                        rules: [
                            { required: true, message: t('customer.phone.required') },
                            { pattern: RegexValidate.PHONE, message: t('global.phone_number.format') },
                        ],
                    }}
                />

                <InfiniteScrollSelect
                    name={['customerPersonInCharge', 'userId']}
                    queryKey={['searchUsersForCustomer']}
                    label={t('customer.person_in_charge_name')}
                    placeholder={t('customer.select_person_in_charge')}
                    labelRender={value => value?.label ?? form.getFieldValue(['customerPersonInCharge', 'userName'])}
                    formItemProps={{
                        required: true,
                        rules: [{ required: true, message: t('customer.person_in_charge_name.required') }],
                    }}
                    showSearch
                    fetchData={async ({ pageNumber, pageSize, search }) => {
                        const resp = await apiSearchUsers(pageNumber, pageSize, search || '', { loading: false });
                        return resp.data;
                    }}
                    onChange={(value, option: any) => {
                        if (!option || Array.isArray(option)) return;
                        const { id, fullName, phoneNumber, email, positionNames } = option;
                        form.setFieldsValue({
                            customerPersonInCharge: {
                                userId: id,
                                userName: fullName,
                                userPhone: phoneNumber,
                                userEmail: email,
                                userPosition: positionNames,
                            },
                        });
                    }}
                    mapData={(data: any[]) =>
                        data.map(user => ({
                            key: user.id,
                            value: user.id,
                            label: user.fullName,
                            ...user,
                            positionNames: getPositionNames(user),
                        }))
                    }
                />
                <BaseInput name={['customerPersonInCharge', 'userPhone']} hidden />
                <BaseInput name={['customerPersonInCharge', 'userEmail']} hidden />
                <BaseInput name={['customerPersonInCharge', 'userPosition']} hidden />
                <BaseInput name="nameShort" hidden />
            </Form>
        </Drawer>
    );
};

export default QuickAddCustomer;
