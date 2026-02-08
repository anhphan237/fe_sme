import { apiSearchSupplierType } from '@/api/category.api';
import { apiAddSupplierInfo } from '@/api/supplier.api';
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

import { IAddEditSupplier } from '@/interface/supplier';

interface IProps {
    open: boolean;
    onClose: () => void;
}

const QuickAddSupplier = ({ onClose, open }: IProps) => {
    const { t } = useLocale();
    const [form] = Form.useForm();
    const isFullPermission = useCheckIsFullPermission(DefaultMappingPermission[AppRouters.SUPPLIER_INFO]);

    const handleAddEdit = async (data: any) => {
        try {
            const params: IAddEditSupplier = {
                supplierTypeId: data.supplierTypeId,
                name: data.name,
                nameShort: data.nameShort,
                phone: data.phone,
                email: data.email,
                address: data.address,
                description: data.description,
                taxCode: data.taxCode,
                supplierPersonInCharge: data.supplierPersonInCharge?.userId
                    ? {
                          userId: data.supplierPersonInCharge.userId,
                      }
                    : undefined,
                supplierContactPersons: data.supplierContactPersons?.map((item: any, index: number) => ({
                    name: item.name,
                    phone: item.phone,
                    position: item.position,
                    description: item.description,
                    number: index + 1,
                })),
                supplierBankAccounts: data.supplierBankAccounts?.map((item: any, index: number) => ({
                    bankAccountName: item.bankAccountName,
                    bankAccountNumber: item.bankAccountNumber,
                    bankName: item.bankName,
                    bankBranch: item.bankBranch,
                    description: item.description,
                    number: index + 1,
                })),
            };

            const res = await apiAddSupplierInfo({ Payload: params });

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
            title={t('supplier.add')}
            width={460}
            footer={
                <div className="flex justify-end items-center pt-2 col-span-6 gap-2">
                    <BaseButton label={t('global.popup.reject')} onClick={onClose} disabled={false} />
                    <BaseButton label={t('global.popup.save')} type="primary" htmlType="submit" form="formSupplier" />
                </div>
            }
        >
            <Form
                name="form-supplier-profile-v2"
                id="formSupplier"
                layout="vertical"
                className="w-full flex flex-col gap-4 bg-white rounded-lg overflow-auto"
                onFinish={handleAddEdit}
                autoComplete="off"
                form={form}
                onKeyDown={e => {
                    if (e.key === 'Enter') e.preventDefault();
                }}
                initialValues={{
                    supplierPersonInCharge: { userId: undefined },
                    supplierContactPersons: [],
                    supplierBankAccounts: [],
                }}
                preserve
                clearOnDestroy
                disabled={!isFullPermission}
            >
                <InfiniteScrollSelect
                    name="supplierTypeId"
                    queryKey={['getListSupplierTypev3']}
                    label={t('supplier.type')}
                    placeholder={t('supplier.type')}
                    labelRender={value => value?.label ?? form.getFieldValue('supplierTypeName')}
                    formItemProps={{
                        rules: [{ required: true, message: t('supplier.type.required') }],
                        required: true,
                    }}
                    showSearch
                    fetchData={async ({ pageNumber, pageSize, search }) => {
                        const resp = await apiSearchSupplierType({ pageNumber, pageSize, search }, { loading: false });
                        return resp.data;
                    }}
                />
                <BaseInput
                    label={t('supplier.name')}
                    placeholder={t('supplier.name')}
                    name="name"
                    onChange={e => form.setFieldValue('nameShort', e.target.value)}
                    formItemProps={{
                        required: true,
                        rules: [{ required: true, message: t('supplier.name.required') }],
                        className: 'col-span-1',
                    }}
                />

                <BaseInput
                    label={t('supplier.phone')}
                    placeholder={t('supplier.phone')}
                    name="phone"
                    formItemProps={{
                        required: true,
                        rules: [
                            { required: true, message: t('supplier.phone.required') },
                            { pattern: RegexValidate.PHONE, message: t('global.phone_number.format') },
                        ],
                    }}
                />

                <InfiniteScrollSelect
                    name={['supplierPersonInCharge', 'userId']}
                    queryKey={['searchUsersForSupplier']}
                    label={t('supplier.person_in_charge_name')}
                    placeholder={t('supplier.select_person_in_charge')}
                    labelRender={value => value?.label ?? form.getFieldValue(['supplierPersonInCharge', 'userName'])}
                    formItemProps={{
                        required: true,
                        rules: [{ required: true, message: t('supplier.person_in_charge_name.required') }],
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
                            supplierPersonInCharge: {
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
                <BaseInput name={['supplierPersonInCharge', 'userPhone']} hidden />
                <BaseInput name={['supplierPersonInCharge', 'userEmail']} hidden />
                <BaseInput name={['supplierPersonInCharge', 'userPosition']} hidden />
                <BaseInput name="nameShort" hidden />
            </Form>
        </Drawer>
    );
};

export default QuickAddSupplier;
