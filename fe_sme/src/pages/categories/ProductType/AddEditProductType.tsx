import { apiAddProductType, apiSearchProductsGroup, apiUpdateProductType } from '@/api/category.api';
import BaseInput from '@/core/components/Input/InputWithLabel';
import InfiniteScrollSelect from '@/core/components/Select/InfinitieScroll';
import { useLocale } from '@/i18n';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Drawer, Form, Table } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { isEmpty } from 'lodash';

import DrawerFooter from '@/pages/sales/components/DrawerFooter';

import BaseButton from '@/components/button';
import { notify } from '@/components/toast-message';

import { convertAttributes, parseAttributes } from '@/utils/helpers';

interface IProps {
    initValue: any;
    onClose: () => void;
    canEdit: boolean;
}

const AddEditProductType = (props: IProps) => {
    const { initValue, onClose, canEdit } = props;
    const { t } = useLocale();
    const isEdit = !isEmpty(initValue);
    const [form] = Form.useForm();

    const onSubmit = async () => {
        const values = await form.validateFields();
        const params = {
            ...(isEdit && { id: initValue?.id, code: initValue?.code }),
            ...values,
            attributeJson: convertAttributes(values?.attributeJson),
        };
        const res = isEdit ? await apiUpdateProductType(params) : await apiAddProductType(params);
        if (res.succeeded) {
            notify.success(isEdit ? t('message.update_success') : t('message.add_success'));
            onClose();
        } else notify.error(t('message.failed'));
    };

    return (
        <Drawer
            title={t(initValue?.id ? 'Update product type' : 'Create product type')}
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
                name="form-product-type"
                layout="vertical"
                className="w-full space-y-4"
                form={form}
                autoComplete="off"
                initialValues={initValue ? { ...initValue, attributeJson: parseAttributes(initValue?.attributeJson) } : {}}
                onKeyDown={e => {
                    if (e.key === 'Enter') e.preventDefault();
                }}
                disabled={!canEdit}
                clearOnDestroy
            >
                <InfiniteScrollSelect
                    name="productGroupId"
                    queryKey={['getListProductGroupv2']}
                    label={t('Select product group')}
                    placeholder={t('Select product group')}
                    labelRender={value => value?.label ?? initValue?.productGroupName}
                    formItemProps={{
                        rules: [{ required: true, message: t('product.add_edit.name.required') }],
                        required: true,
                        className: 'mt-1',
                    }}
                    showSearch
                    fetchData={async ({ pageNumber, pageSize, search }) => {
                        const resp = await apiSearchProductsGroup({ pageNumber, pageSize, search }, { loading: false });
                        return resp.data;
                    }}
                />
                <BaseInput
                    label={t('Product type name')}
                    formItemProps={{ rules: [{ required: true, message: t('Product type name cannot be empty') }] }}
                    name={'name'}
                    placeholder={t('Product type name')}
                />
                <Form.List name="attributeJson">
                    {(fields, { add, remove }) => {
                        const columns: ColumnsType = [
                            {
                                title: t('category.list.index'),
                                dataIndex: 'stt',
                                align: 'center',
                                className: 'text-center',
                                width: 50,
                                render: (_: any, __: any, index: number) => index + 1,
                            },
                            {
                                title: (
                                    <span>
                                        {t('product.attribute_name')}
                                        <span className="text-red-600">*</span>
                                    </span>
                                ),
                                dataIndex: 'attributeName',
                                width: 200,
                                render: (_: any, __: any, index: number) => (
                                    <BaseInput
                                        {...fields[index]}
                                        name={[fields[index].name, 'attributeName']}
                                        label=""
                                        placeholder={t('product.attribute_name')}
                                        formItemProps={{
                                            className: 'w-full',
                                            rules: [{ required: true, message: t('global.message.required_field') }],
                                        }}
                                    />
                                ),
                            },
                            {
                                title: <span>{t('product.attribute_value')}</span>,
                                dataIndex: 'attributeValue',
                                width: 200,
                                render: (_: any, __: any, index: number) => (
                                    <BaseInput
                                        {...fields[index]}
                                        name={[fields[index].name, 'attributeValue']}
                                        label=""
                                        placeholder={t('product.attribute_value')}
                                        formItemProps={{
                                            className: 'w-full',
                                        }}
                                    />
                                ),
                            },
                            {
                                title: t('Action'),
                                dataIndex: 'actions',
                                width: 100,
                                align: 'center',
                                className: 'text-center',
                                render: (_: any, __: any, index: number) => (
                                    <BaseButton
                                        className="text-red-500"
                                        type="text"
                                        size="small"
                                        onClick={() => remove(fields[index].name)}
                                        icon={<DeleteOutlined />}
                                    />
                                ),
                            },
                        ];

                        return (
                            <div className="col-span-6 space-y-4">
                                <div className="col-span-6 font-bold flex justify-center items-center gap-2">
                                    <div className="min-w-fit">{t('product.attribute')}</div>
                                    <div className="h-[1px] w-full bg-gray-400 mt-1" />
                                    <BaseButton icon={<PlusOutlined />} label={t('Add new')} type="primary" onClick={() => add()} />
                                </div>

                                <Table key={'productTypeTable'} bordered columns={columns} dataSource={fields} pagination={false} rowKey="key" />
                            </div>
                        );
                    }}
                </Form.List>
            </Form>
        </Drawer>
    );
};

export default AddEditProductType;
