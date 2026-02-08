import { apiAddProductGroup, apiDeleteProductGroup, apiSearchProductsGroup, apiUpdateProductGroup } from '@/api/category.api';
import { AppRouters, DefaultMappingPermission, ENV_CONFIG } from '@/constants';
import ImportModal, { ImportModalRef } from '@/core/components/FileManager/ImportModal';
import BaseInput from '@/core/components/Input/InputWithLabel';
import BaseModal from '@/core/components/Modal/BaseModal';
import BaseTextArea from '@/core/components/TextArea/BaseTextArea';
import { useLocale } from '@/i18n';
import { DeleteOutlined, FileAddOutlined } from '@ant-design/icons';
import { faUpload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useQuery } from '@tanstack/react-query';
import Form from 'antd/es/form';
import Popconfirm from 'antd/es/popconfirm';
import { useRef, useState } from 'react';

import BaseButton from '@/components/button';
import Search from '@/components/search';
import ProductGroupTable from '@/components/table';
import { notify } from '@/components/toast-message';

import useCheckIsFullPermission from '@/hooks/useCheckIsFullPermission';

import { handleCommonError } from '@/utils/helpers';

import { IAddEditProductGroup } from '@/interface/category';
import { PageFilter } from '@/interface/common';

const { Column } = ProductGroupTable;

interface ColumnType {
    id: string;
    code: string;
    name: string;
    created: string;
    lastModified: string;
}

const ProductGroup = () => {
    const { t } = useLocale();
    const importRef = useRef<ImportModalRef>(null);
    const [formData, setFormData] = useState<IAddEditProductGroup | null>(null);
    const [filter, setFilter] = useState<PageFilter>({
        pageSize: 10,
        pageNumber: 1,
        search: undefined,
    });

    const isFullPermission = useCheckIsFullPermission(DefaultMappingPermission[AppRouters.PRODUCT_GROUP]);

    const { data, refetch } = useQuery({
        queryKey: ['getListProductGroup', filter],
        queryFn: async () => {
            const res = await apiSearchProductsGroup(filter);
            return res;
        },
    });

    const handleAddEdit = async (data: IAddEditProductGroup) => {
        const isEdit = !!formData?.id;
        const params = {
            ...(isEdit && { id: formData?.id, code: formData?.code }),
            ...data,
        };
        const res = isEdit ? await apiUpdateProductGroup(params) : await apiAddProductGroup(params);
        if (res.succeeded) {
            notify.success(isEdit ? t('message.update_success') : t('message.add_success'));
            setFormData(null);
            refetch();
        } else notify.error(t('message.failed'));
    };

    const handleClose = () => {
        setFormData(null);
    };

    const handleDelete = async (recordId: string) => {
        const res = await apiDeleteProductGroup(recordId);
        if (res.succeeded) {
            notify.success(t('message.delete_success'));
            refetch();
        } else {
            handleCommonError(res, t, t('message.delete_failed'));
        }
    };

    const handleImport = async () => {
        await importRef.current?.open();
    };

    return (
        <div className="h-full flex flex-col p-4">
            <div className="flex justify-between mb-2 mx-2 gap-2">
                <div className="flex gap-2">
                    <BaseButton
                        className="mb-2"
                        onClick={() => setFormData({})}
                        icon={<FileAddOutlined />}
                        label="Add new"
                        disabled={!isFullPermission}
                    />
                    <BaseButton
                        className="mb-2"
                        onClick={handleImport}
                        icon={<FontAwesomeIcon icon={faUpload} />}
                        label={t('global.upload')}
                        disabled={!isFullPermission}
                    />
                </div>
                <Search
                    placeholder={t('global.search_table')}
                    allowClear
                    className="btn-search-table"
                    onSearch={value => {
                        setFilter({ ...filter, pageNumber: 1, search: value });
                    }}
                />
            </div>

            <BaseModal
                title={t(formData?.id ? 'Update product group' : 'Create product group')}
                open={!!formData}
                onCancel={handleClose}
                centered={true}
                footer={false}
                destroyOnClose
            >
                <Form
                    name="form-product-group"
                    layout="vertical"
                    className="w-full space-y-4"
                    onFinish={handleAddEdit}
                    autoComplete="off"
                    initialValues={formData || {}}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                            e.preventDefault();
                        }
                    }}
                    disabled={!isFullPermission}
                >
                    <BaseInput
                        label={t('Product group name')}
                        formItemProps={{ rules: [{ required: true, message: t('Product group name cannot be empty') }] }}
                        name="name"
                        placeholder={t('Product group name')}
                    />
                    <BaseTextArea
                        label={t('global.description')}
                        name="attributeJson"
                        placeholder={t('global.description')}
                        autoSize={{ minRows: 5, maxRows: 5 }}
                    />
                    <Form.Item className="flex justify-end items-center !mb-0">
                        <BaseButton label={t('global.popup.reject')} onClick={handleClose} className="mr-2" disabled={false} />
                        <BaseButton label={t('global.popup.save')} type="primary" htmlType="submit" />
                    </Form.Item>
                </Form>
            </BaseModal>

            <ProductGroupTable<ColumnType>
                dataSource={data?.data || []}
                rowKey={record => record?.id}
                wrapClassName="!h-full w-full"
                pagination={{
                    current: filter.pageNumber,
                    pageSize: filter.pageSize,
                    total: data?.totalItems,
                    onChange: (page, pageSize) => {
                        setFilter({ ...filter, pageNumber: page, pageSize });
                    },
                }}
            >
                <Column
                    title={<div className="flex items-center justify-center">{t('category.list.index')}</div>}
                    dataIndex="index"
                    width={50}
                    key="index"
                    render={(_, __, index: number) => (
                        <div className="flex items-center justify-center mb-0">{(filter.pageNumber - 1) * filter.pageSize + (index + 1)}</div>
                    )}
                />
                <Column
                    title={t('Product group code')}
                    dataIndex="code"
                    onCell={() => ({ width: 180 })}
                    onHeaderCell={() => ({ style: { width: 180, minWidth: 180 } })}
                    key="code"
                    render={(_, record: ColumnType) => {
                        return (
                            <div className="text-blue-500 font-medium">
                                <span className="cursor-pointer" onClick={() => setFormData(record)}>
                                    {record.code}
                                </span>
                            </div>
                        );
                    }}
                />
                <Column
                    ellipsis
                    onCell={() => ({ width: 400 })}
                    onHeaderCell={() => ({ style: { width: 400, minWidth: 400 } })}
                    title={t('Product group name')}
                    dataIndex="name"
                    key="name"
                    className="max-w-96"
                />
                <Column
                    title={t('global.description')}
                    onCell={() => ({ width: 250 })}
                    onHeaderCell={() => ({ style: { width: 250, minWidth: 250 } })}
                    dataIndex="attributeJson"
                    key="attributeJson"
                    className="max-w-96"
                    width={250}
                    ellipsis
                />

                <Column
                    onCell={() => ({ width: 80 })}
                    onHeaderCell={() => ({ style: { width: 80, minWidth: 80 } })}
                    align="center"
                    render={(_, record: ColumnType) => (
                        <div className="flex justify-center">
                            <Popconfirm
                                title={t('global.popup.confirm_delete')}
                                onConfirm={() => handleDelete(record?.id)}
                                okText={t('global.popup.ok')}
                                cancelText={t('global.popup.reject')}
                                placement="left"
                            >
                                <BaseButton
                                    disabled={!isFullPermission}
                                    className="text-red-500"
                                    type="text"
                                    size="small"
                                    icon={<DeleteOutlined />}
                                />
                            </Popconfirm>
                        </div>
                    )}
                />
            </ProductGroupTable>
            <ImportModal
                ref={importRef}
                mode="productGroup"
                templateType="ProductGroup"
                fullUrl={`${ENV_CONFIG.API}/${ENV_CONFIG.API_VERSION}/ProductGroup/import`}
                title={t('product_group.import')}
                onUploadSuccess={() => refetch()}
            />
        </div>
    );
};

export default ProductGroup;
