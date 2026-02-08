// import { apiCloneTenant, apiCreateTenant, apiDeleteTenant, apiGetTenant, apiUpdateTenant } from '@/api/role-group.api';
import { apiGetAllTenants } from '@/api/tenant.api';
import { useLocale } from '@/i18n';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import TenantTable from '@/components/table';

import { ITenantList } from '@/interface/system';

import UpdateTenant from './UpdateTenant';

// import { IAddEditTenant, ITenant, ITenantListResponse } from '@/interface/system';

const { Column } = TenantTable;

const Tenant = () => {
    const [formData, setFormData] = useState<ITenantList | null>(null);

    const { t } = useLocale();

    const { data, refetch, isFetching } = useQuery({
        queryKey: ['getListTenantDetail'],
        queryFn: async () => {
            const res = await apiGetAllTenants();
            return res.data;
        },
    });

    const handleClose = () => {
        setFormData(null);
        refetch();
    };

    return (
        <div className="h-full flex flex-col p-4">
            <TenantTable<ITenantList>
                dataSource={data || []}
                rowKey={record => record.id}
                scroll={{ y: undefined }}
                loading={isFetching}
                wrapClassName="!h-full w-full"
                pagination={{
                    total: data?.length,
                    pageSize: 10,
                    current: 1,
                }}
            >
                <Column
                    title={<div className="flex items-center justify-center">{t('category.list.index')}</div>}
                    dataIndex="index"
                    width={50}
                    key="index"
                    render={(_, __, index: number) => <div className="flex items-center justify-center mb-0">{index + 1}</div>}
                />
                <Column
                    title={t('tenant.code')}
                    dataIndex="code"
                    onCell={() => ({ width: 180 })}
                    onHeaderCell={() => ({ style: { width: 180, minWidth: 180 } })}
                    key="code"
                    render={(_, record: ITenantList) => {
                        return (
                            <div className="text-blue-500 font-medium cursor-pointer" onClick={() => setFormData(record)}>
                                {record.code}
                            </div>
                        );
                    }}
                />
                <Column
                    title={t('tenant.name')}
                    ellipsis
                    onCell={() => ({ width: 400 })}
                    onHeaderCell={() => ({ style: { width: 400, minWidth: 400 } })}
                    dataIndex="name"
                    key="name"
                />
                <Column
                    title={t('tenant.short_name')}
                    ellipsis
                    dataIndex="shortName"
                    onCell={() => ({ width: 300 })}
                    onHeaderCell={() => ({ style: { width: 300, minWidth: 300 } })}
                    key="shortName"
                />
                <Column
                    title={t('tenant.phone')}
                    ellipsis
                    onCell={() => ({ width: 240 })}
                    onHeaderCell={() => ({ style: { width: 240, minWidth: 240 } })}
                    dataIndex="phoneNumber"
                    key="phoneNumber"
                />
                <Column
                    title={t('tenant.address')}
                    ellipsis
                    onCell={() => ({ width: 240 })}
                    onHeaderCell={() => ({ style: { width: 240, minWidth: 240 } })}
                    dataIndex="address"
                    key="address"
                />
            </TenantTable>
            <UpdateTenant onClose={handleClose} initValue={formData} />
        </div>
    );
};

export default Tenant;
