import { apiAddWarehouse, apiSearchWarehouseArea, apiUpdateWarehouse } from '@/api/category.api';
import { apiGetAllDistrictsInProvince, apiGetAllProvinces, apiGetAllWardsInDistrict } from '@/api/country.api';
import BaseInput from '@/core/components/Input/InputWithLabel';
import BaseModal from '@/core/components/Modal/BaseModal';
import BaseSelect from '@/core/components/Select/BaseSelect';
import InfiniteScrollSelect from '@/core/components/Select/InfinitieScroll';
import BaseTextArea from '@/core/components/TextArea/BaseTextArea';
import { useLocale } from '@/i18n';
import { useQuery } from '@tanstack/react-query';
import { Form } from 'antd';
import { useEffect } from 'react';

import BaseButton from '@/components/button';
import { notify } from '@/components/toast-message';

import { IAddEditWarehouse } from '@/interface/category';

interface IProps {
    formData: IAddEditWarehouse | null;
    handleClose: () => void;
}

const ModalAddEditWarehouse = ({ formData, handleClose }: IProps) => {
    const { t } = useLocale();

    const [form] = Form.useForm();
    const country = Form.useWatch('country', form);

    useEffect(() => {
        if (formData) {
            let initData = {};
            if (formData?.administrativeDivision) {
                initData = { ...formData, ...JSON.parse(formData?.administrativeDivision), country: JSON.parse(formData?.administrativeDivision) };
            }
            form.setFieldsValue(initData);
        } else {
            form.resetFields();
        }
    }, [formData]);

    const provinceId = Form.useWatch('provinceId', form);
    const districtId = Form.useWatch('districtId', form);

    const { data: provinces } = useQuery({
        queryKey: ['getAllProvinces'],
        queryFn: async () => {
            const res = await apiGetAllProvinces();
            return res?.data?.data?.data?.map((item: { code: string; name: string }) => ({
                value: item?.code,
                label: item?.name,
            }));
        },
        enabled: !!formData,
    });

    const { data: districts } = useQuery({
        queryKey: ['getAllDistricts', provinceId],
        queryFn: async () => {
            const res = await apiGetAllDistrictsInProvince(provinceId);
            return res?.data?.data?.data?.map((item: { code: string; name: string }) => ({
                value: item?.code,
                label: item?.name,
            }));
        },
        enabled: !!provinceId,
    });

    const { data: wards } = useQuery({
        queryKey: ['getAllWards', districtId],
        queryFn: async () => {
            const res = await apiGetAllWardsInDistrict(districtId);
            return res?.data?.data?.data?.map((item: { code: string; name: string }) => ({
                value: item?.code,
                label: item?.name,
            }));
        },
        enabled: !!districtId,
    });

    const handleAddEdit = async (data: IAddEditWarehouse) => {
        const provinceName = provinces?.find((prv: { value: string; label: string }) => prv?.value === data?.provinceId)?.label || '';
        const districtName = districts?.find((dis: { value: string; label: string }) => dis?.value === data?.districtId)?.label || '';
        const wardName = wards?.find((ward: { value: string; label: string }) => ward?.value === data?.wardId)?.label || '';
        const addressParts = [data?.description, wardName, districtName, provinceName].filter(Boolean);
        const fullAddress = addressParts.join(' - ');
        const administrativeDivision = JSON.stringify({
            provinceName,
            provinceId: data?.provinceId,
            districtName,
            districtId: data?.districtId,
            wardName,
            wardId: data?.wardId,
            address: fullAddress,
        });
        const isEdit = !!formData?.id;
        const params = {
            ...(isEdit && { id: formData?.id, code: formData?.code }),
            name: data?.name,
            warehouseTypeId: data?.warehouseTypeId,
            description: data?.description,
            administrativeDivision,
        };
        const res = isEdit ? await apiUpdateWarehouse(params) : await apiAddWarehouse(params);
        if (res.succeeded) {
            notify.success(isEdit ? t('message.update_success') : t('message.add_success'));
            handleClose();
        } else notify.error(t('message.failed'));
    };

    return (
        <BaseModal
            title={t(formData?.id ? 'Update warehouse' : 'Create warehouse')}
            open={!!formData}
            onCancel={handleClose}
            onClose={handleClose}
            centered={true}
            footer={false}
            width={'50vw'}
            destroyOnClose
        >
            <Form
                name="form-warehouse"
                layout="vertical"
                form={form}
                className="w-full grid grid-cols-2 gap-4"
                onFinish={handleAddEdit}
                autoComplete="off"
                onKeyDown={e => {
                    if (e.key === 'Enter') e.preventDefault();
                }}
                preserve
            >
                <InfiniteScrollSelect
                    name="warehouseTypeId"
                    queryKey={['getListWareTypev2']}
                    label={t('Warehouse type name')}
                    placeholder={t('Warehouse type name')}
                    labelRender={value => value?.label ?? form.getFieldValue('warehouseTypeName')}
                    formItemProps={{
                        rules: [{ required: true, message: t('Warehouse type name cannot be empty') }],
                        required: true,
                    }}
                    showSearch
                    fetchData={async ({ pageNumber, pageSize, search }) => {
                        const resp = await apiSearchWarehouseArea({ pageNumber, pageSize, search }, { loading: false });
                        return resp.data;
                    }}
                />
                <BaseInput
                    name="name"
                    label={t('Warehouse name')}
                    placeholder={t('Warehouse name')}
                    formItemProps={{ required: true, rules: [{ required: true, message: t('Warehouse name cannot be empty') }] }}
                />
                <BaseInput name="country" formItemProps={{ className: 'hidden' }} />
                <BaseSelect
                    name="provinceId"
                    label={t('Select province')}
                    onChange={e => {
                        form.setFieldsValue({ provinceId: e, districtId: undefined, wardId: undefined });
                    }}
                    placeholder={t('Select province')}
                    labelRender={value => value?.label ?? country?.provinceName}
                    formItemProps={{ required: true, rules: [{ required: true, message: t('Province cannot be empty') }] }}
                    showSearch
                    allowClear
                    optionFilterProp="label"
                    options={provinces || []}
                />
                <BaseSelect
                    name="districtId"
                    label={t('Select district')}
                    onChange={e => {
                        form.setFieldsValue({ districtId: e, wardId: undefined });
                    }}
                    labelRender={value => value?.label ?? country?.districtName}
                    placeholder={t('Select district')}
                    showSearch
                    allowClear
                    optionFilterProp="label"
                    options={districts || []}
                />
                <BaseSelect
                    name="wardId"
                    label={t('Select ward')}
                    onChange={e => {
                        form.setFieldValue('wardId', e);
                    }}
                    labelRender={value => value?.label ?? country?.wardName}
                    placeholder={t('Select ward')}
                    showSearch
                    allowClear
                    optionFilterProp="label"
                    options={wards || []}
                />
                <BaseTextArea label={t('product.add_edit.description')} name="description" rows={1} placeholder={t('product.add_edit.description')} />
                <Form.Item className="col-span-2 flex justify-end items-center !mb-0">
                    <BaseButton label={t('global.popup.reject')} onClick={handleClose} className="mr-2" />
                    <BaseButton label={t('global.popup.save')} type="primary" htmlType="submit" />
                </Form.Item>
            </Form>
        </BaseModal>
    );
};

export default ModalAddEditWarehouse;
