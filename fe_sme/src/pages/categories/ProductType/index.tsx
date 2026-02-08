import { apiDeleteProductType, apiSearchProductType } from '@/api/category.api';
import { AppRouters, DefaultMappingPermission, ENV_CONFIG } from '@/constants';
import ImportModal, { ImportModalRef } from '@/core/components/FileManager/ImportModal';
import { useLocale } from '@/i18n';
import { DeleteOutlined, FileAddOutlined, UploadOutlined } from '@ant-design/icons';
import { faUpload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useQuery } from '@tanstack/react-query';
import Popconfirm from 'antd/es/popconfirm';
import { useRef, useState } from 'react';

import BaseButton from '@/components/button';
import Search from '@/components/search';
import ProductTypeTable from '@/components/table';
import { notify } from '@/components/toast-message';

import useCheckIsFullPermission from '@/hooks/useCheckIsFullPermission';

import { formatDateTime } from '@/utils/format-datetime';
import { handleCommonError } from '@/utils/helpers';

import { IAddEditProductType } from '@/interface/category';
import { PageFilter } from '@/interface/common';

import AddEditProductType from './AddEditProductType';

const { Column } = ProductTypeTable;

interface ColumnType {
    id: string;
    code: string;
    name: string;
    created: string;
    lastModified: string;
}

const ProductType = () => {
    const { t } = useLocale();
    const importRef = useRef<ImportModalRef>(null);

    const [formData, setFormData] = useState<IAddEditProductType | null>(null);
    const [filter, setFilter] = useState<PageFilter>({
        pageSize: 10,
        pageNumber: 1,
        search: undefined,
    });
    const isFullPermission = useCheckIsFullPermission(DefaultMappingPermission[AppRouters.PRODUCT_TYPE]);
    const { data, refetch } = useQuery({
        queryKey: ['getListProductType', filter],
        queryFn: async () => {
            const res = await apiSearchProductType(filter, { loading: false });
            return res;
        },
    });

    const handleDelete = async (recordId: string) => {
        const res = await apiDeleteProductType(recordId);
        if (res.succeeded) {
            notify.success(t('message.delete_success'));
            refetch();
        } else {
            handleCommonError(res, t, t('message.delete_failed'));
        }
    };

    const handleClose = () => {
        setFormData(null);
        refetch();
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
                        onClick={() => {
                            setFormData({});
                        }}
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

            <ProductTypeTable<ColumnType>
                dataSource={data?.data || []}
                rowKey={record => record.id}
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
                    key="index"
                    width={50}
                    render={(_, __, index: number) => (
                        <div className="flex items-center justify-center mb-0">{(filter.pageNumber - 1) * filter.pageSize + (index + 1)}</div>
                    )}
                />
                <Column
                    title={t('Product type code')}
                    dataIndex="code"
                    width={150}
                    onCell={() => ({ width: 150 })}
                    onHeaderCell={() => ({ style: { width: 150, minWidth: 150 } })}
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
                    title={t('Product type name')}
                    dataIndex="name"
                    key="name"
                    className="max-w-96"
                />
                <Column
                    ellipsis
                    onCell={() => ({ width: 200 })}
                    onHeaderCell={() => ({ style: { width: 200, minWidth: 200 } })}
                    title={t('Product group name')}
                    dataIndex="productGroupName"
                    key="productGroupName"
                    className="max-w-96"
                />
                <Column
                    title={t('Created at')}
                    dataIndex="created"
                    onCell={() => ({ width: 180 })}
                    onHeaderCell={() => ({ style: { width: 180, minWidth: 180 } })}
                    ellipsis
                    key="created"
                    render={(_, record: ColumnType) => <div>{formatDateTime(record.created)}</div>}
                />
                <Column
                    title={t('Updated at')}
                    dataIndex="lastModified"
                    onCell={() => ({ width: 180 })}
                    onHeaderCell={() => ({ style: { width: 180, minWidth: 180 } })}
                    ellipsis
                    key="lastModified"
                    render={(_, record: ColumnType) => <div>{formatDateTime(record.lastModified)}</div>}
                />
                <Column
                    width={80}
                    onCell={() => ({ width: 80 })}
                    onHeaderCell={() => ({ style: { width: 80, minWidth: 80 } })}
                    align="center"
                    render={(_, record: ColumnType) => (
                        <div className="flex justify-center">
                            <Popconfirm
                                title={t('global.popup.confirm_delete')}
                                onConfirm={() => handleDelete(record.id)}
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
            </ProductTypeTable>
            <AddEditProductType onClose={handleClose} initValue={formData} canEdit={isFullPermission} />
            <ImportModal
                ref={importRef}
                mode="productType"
                templateType="ProductType"
                fullUrl={`${ENV_CONFIG.API}/${ENV_CONFIG.API_VERSION}/ProductType/import`}
                title={t('product_type.import')}
                onUploadSuccess={() => refetch()}
            />
        </div>
    );
};

export default ProductType;
