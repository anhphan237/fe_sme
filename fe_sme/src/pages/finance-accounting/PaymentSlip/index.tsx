import { apiSearchExpensesType } from '@/api/category.api';
import { apiDeletePaymentSlip, apiSearchPaymentSlip } from '@/api/payment-slip.api';
import { ParamsGetList } from '@/api/request';
import { AppRouters, DefaultMappingPermission, DefaultRoles } from '@/constants';
import ExportModal, { AdditionalFilterConfig, ExportModalRef } from '@/core/components/FileManager/ExportModal';
import InfiniteScrollSelect from '@/core/components/Select/InfinitieScroll';
import PaymentSlipTag, { COMMON_STATUS } from '@/core/components/Status/PaymentSlipTag';
import { useLocale } from '@/i18n';
import { useAppSelector } from '@/stores';
import { DeleteOutlined, FileAddOutlined } from '@ant-design/icons';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useQuery } from '@tanstack/react-query';
import { Select } from 'antd';
import Popconfirm from 'antd/es/popconfirm';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import BaseButton from '@/components/button';
import DateRangeFilter from '@/components/custom-range-picker';
import Search from '@/components/search';
import PaymentSlipTable from '@/components/table';
import { notify } from '@/components/toast-message';

import useCheckIsFullPermission from '@/hooks/useCheckIsFullPermission';

import { formatDateTime } from '@/utils/format-datetime';
import { FileHelper, formatMoney, handleCommonError } from '@/utils/helpers';

import { PaymentSlipRequester, PaymentSlipType } from '@/interface/payment-slip';

const { Column } = PaymentSlipTable;

const PaymentSlip = () => {
    const { t } = useLocale();
    const navigate = useNavigate();
    const isFullPermission = useCheckIsFullPermission(DefaultMappingPermission[AppRouters.PAYMENT_SLIP]);
    const { userProfileInfo: currentUser } = useAppSelector(state => state.global) ?? {};
    const exportRef = useRef<ExportModalRef>(null);
    const canExport = useCheckIsFullPermission(DefaultMappingPermission['FinanceReport']);
    const isAdmin = currentUser?.roles?.some(role => role.code === DefaultRoles.ADMIN || role.code === DefaultRoles.SUPER_ADMIN) ?? false;

    const canDelete = (record: PaymentSlipType) => {
        if (isAdmin) return true;
        return isFullPermission && record.status === COMMON_STATUS.UnPaid;
    };

    const [filter, setFilter] = useState<ParamsGetList>({
        pageSize: 10,
        pageNumber: 1,
        searchValue: undefined,
        filters: [{ key: 'status', value: [COMMON_STATUS.UnPaid] }],
    });

    const { data, refetch } = useQuery({
        queryKey: ['getListPaymentSlip', filter],
        queryFn: async () => {
            const res = await apiSearchPaymentSlip(filter);
            return res;
        },
    });

    const handleExpensesTypeChange = (values: string[]) => {
        setFilter(prev => {
            const otherFilters = prev.filters?.filter(f => f.key !== 'ticketType') || [];
            return {
                ...prev,
                pageNumber: 1,
                filters: values.length ? [...otherFilters, { key: 'ticketType', value: values }] : otherFilters.length ? otherFilters : undefined,
            };
        });
    };

    const handleDelete = async (recordId: string) => {
        try {
            const res = await apiDeletePaymentSlip(recordId);
            if (res.succeeded) {
                notify.success(t('global.message.success'));
                refetch();
            } else throw res;
        } catch (error: any) {
            handleCommonError(error, t);
        }
    };

    const handleStatusChange = (values: number[]) => {
        setFilter(prev => {
            const otherFilters = prev.filters?.filter(f => f.key !== 'status') || [];

            return {
                ...prev,
                pageNumber: 1,
                filters: values.length ? [...otherFilters, { key: 'status', value: values }] : otherFilters.length ? otherFilters : undefined,
            };
        });
    };

    const statusOptions = [
        { label: t('finance_accounting.payment_slip.status.paid'), value: COMMON_STATUS.Paid },
        { label: t('finance_accounting.payment_slip.status.unpaid'), value: COMMON_STATUS.UnPaid },
    ];

    const exportFilters: AdditionalFilterConfig[] = [
        {
            name: 'ticketTypes',
            label: t('finance_accounting.payment_slip.ticket_type'),
            type: 'infinite-select',
            placeholder: t('finance_accounting.payment_slip.ticket_type'),
            span: 12,
            fetchData: async ({ pageNumber, pageSize, search }) => {
                const resp = await apiSearchExpensesType({ pageNumber, pageSize, search, Type: [1] }, { loading: false });
                return resp.data;
            },
            mapData: (data: any[]) =>
                data.map(item => ({
                    label: item.name,
                    value: item.code,
                    key: item.id,
                })),
            queryKey: ['paymentSlipExpensesTypeExport'],
            showSearch: true,
            allowClear: true,
            mode: 'multiple',
        },
    ];

    const handleExportReport = async () => {
        try {
            const response = await exportRef.current?.open(statusOptions);
            FileHelper.downloadFileFromResponse(response as any);
            notify.success(t('global.message.export_success'));
        } catch {}
    };

    return (
        <div className="h-full flex flex-col p-4">
            <div className="flex justify-between flex-wrap mx-2 mb-2 gap-2">
                <div className="flex gap-2">
                    <BaseButton
                        icon={<FileAddOutlined />}
                        onClick={() => navigate(AppRouters.PAYMENT_SLIP_ADD)}
                        label={t('global.add_new')}
                        disabled={!isFullPermission}
                    />
                    <BaseButton
                        onClick={handleExportReport}
                        label={t('export.title')}
                        icon={<FontAwesomeIcon icon={faDownload} />}
                        disabled={!canExport}
                    />
                </div>
                <div className="flex gap-2 justify-end">
                    <DateRangeFilter
                        onChange={({ fromDate, toDate }) => {
                            setFilter({
                                ...filter,
                                pageNumber: 1,
                                range: fromDate ? { from: fromDate.toISOString(), to: toDate?.toISOString() } : undefined,
                            });
                        }}
                    />
                    <InfiniteScrollSelect
                        name="ticketType"
                        queryKey={['paymentSlipExpensesTypeFilter']}
                        placeholder={t('finance_accounting.payment_slip.ticket_type')}
                        mode="multiple"
                        className="w-36 min-w-36"
                        value={(filter.filters?.find(f => f.key === 'ticketType')?.value as string[]) || []}
                        onChange={handleExpensesTypeChange}
                        allowClear
                        showSearch
                        maxTagCount="responsive"
                        fetchData={async ({ pageNumber, pageSize, search }) => {
                            const resp = await apiSearchExpensesType({ pageNumber, pageSize, search }, { loading: false });
                            return resp.data;
                        }}
                        mapData={(data: any[]) =>
                            data.map(item => ({
                                label: item.name,
                                value: item.code,
                                key: item.id,
                            }))
                        }
                        formItemProps={{ className: '!mb-0' }}
                    />
                    <Select
                        mode="multiple"
                        className="w-32 min-w-32"
                        placeholder={t('global.status')}
                        value={(filter.filters?.find(f => f.key === 'status')?.value as number[]) || []}
                        onChange={handleStatusChange}
                        options={statusOptions}
                        allowClear
                        showSearch={false}
                        maxTagCount="responsive"
                    />
                    <Search
                        placeholder={t('global.search_table')}
                        allowClear
                        className="btn-search-table "
                        onSearch={value => {
                            setFilter({ ...filter, pageNumber: 1, searchValue: value });
                        }}
                    />
                </div>
            </div>
            <div className="flex justify-end text-lg p-2">
                <span>
                    {`${t('finance_accounting.payment_slip.totalAmount')}: `}{' '}
                    <strong className="text-green-600">{formatMoney(data?.totalMoney || 0)}</strong>
                </span>
            </div>
            <PaymentSlipTable<PaymentSlipType>
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
                    title={t('category.list.index')}
                    dataIndex="index"
                    key="index"
                    fixed="left"
                    onCell={() => ({ width: 60 })}
                    onHeaderCell={() => ({ style: { width: 60, minWidth: 60 } })}
                    align="center"
                    render={(_, __, index: number) => (filter.pageNumber - 1) * filter.pageSize + (index + 1)}
                />
                <Column
                    title={t('finance_accounting.payment_slip.ticket_number')}
                    dataIndex="ticketNumber"
                    key="ticketNumber"
                    fixed="left"
                    onCell={() => ({ width: 200 })}
                    onHeaderCell={() => ({ style: { width: 200, minWidth: 200 } })}
                    align="center"
                    render={(_, record: PaymentSlipType) => {
                        return (
                            <span
                                className="text-blue-500 font-medium cursor-pointer"
                                onClick={() => navigate(`${AppRouters.PAYMENT_SLIP}/${record.id}`)}
                            >
                                {record.ticketNumber || '-'}
                            </span>
                        );
                    }}
                />
                <Column
                    title={t('finance_accounting.payment_slip.document_date')}
                    dataIndex="documentDate"
                    key="documentDate"
                    align="left"
                    onCell={() => ({ width: 200 })}
                    onHeaderCell={() => ({ style: { width: 150, minWidth: 150 } })}
                    render={value => formatDateTime(value)}
                />
                <Column
                    title={t('finance_accounting.payment_slip.ticket_type')}
                    dataIndex="ticketTypeName"
                    align="left"
                    key="ticketType"
                    onCell={() => ({ width: 120 })}
                    onHeaderCell={() => ({ style: { width: 120, minWidth: 120 } })}
                    render={value => value || '-'}
                />

                <Column
                    title={t('finance_accounting.payment_slip.requester')}
                    dataIndex="requester"
                    align="left"
                    key="requester"
                    onCell={() => ({ width: 180 })}
                    onHeaderCell={() => ({ style: { width: 180, minWidth: 180 } })}
                    render={(requester: PaymentSlipRequester) => {
                        return <span className="font-medium">{requester?.userName || '-'}</span>;
                    }}
                />

                <Column
                    title={t('finance_accounting.payment_slip.totalAmount')}
                    dataIndex="totalAmount"
                    key="totalAmount"
                    onCell={() => ({ width: 150 })}
                    onHeaderCell={() => ({ style: { width: 150, minWidth: 150 } })}
                    align="left"
                    render={(totalAmount: number) => {
                        const displayAmount = totalAmount || 0;
                        return <span className="font-semibold text-green-600">{formatMoney(displayAmount)}</span>;
                    }}
                />

                <Column
                    ellipsis
                    title={t('finance_accounting.payment_slip.note')}
                    dataIndex="note"
                    key="note"
                    align="left"
                    onCell={() => ({ width: 250 })}
                    onHeaderCell={() => ({ style: { width: 250, minWidth: 250 } })}
                    render={value => value || '-'}
                />
                <Column
                    title={t('finance_accounting.payment_slip.status')}
                    dataIndex="status"
                    key="status"
                    align="center"
                    fixed="right"
                    width={100}
                    onCell={() => ({ style: { width: 100 } })}
                    onHeaderCell={() => ({ style: { width: 100 } })}
                    render={value => <PaymentSlipTag value={value} className="!inline-block !text-xs w-full !text-center min-w-[100px]" />}
                />
                <Column
                    onCell={() => ({ width: 100 })}
                    fixed="right"
                    align="center"
                    render={(_, record: PaymentSlipType) => {
                        const canDeleteThis = canDelete(record);

                        return (
                            <div className="flex gap-2 justify-center">
                                <Popconfirm
                                    title={t('global.popup.confirm_delete')}
                                    description={
                                        record.status === COMMON_STATUS.Paid && !isAdmin
                                            ? t('finance_accounting.payment_slip.message.paid_admin_only')
                                            : undefined
                                    }
                                    onConfirm={() => handleDelete(record.id)}
                                    okText={t('global.popup.ok')}
                                    cancelText={t('global.popup.reject')}
                                    placement="left"
                                    disabled={!canDeleteThis}
                                >
                                    <DeleteOutlined
                                        className={`cursor-pointer ${
                                            !canDeleteThis ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-800'
                                        }`}
                                        title={
                                            canDeleteThis
                                                ? t('global.delete')
                                                : record.status === COMMON_STATUS.Paid
                                                  ? t('finance_accounting.payment_slip.message.paid_admin_only')
                                                  : t('global.message.no_permission')
                                        }
                                    />
                                </Popconfirm>
                            </div>
                        );
                    }}
                />
            </PaymentSlipTable>
            <ExportModal
                ref={exportRef}
                submitLabel={t('global.download')}
                title={t('export.title')}
                urlPath="payment-slips"
                additionalFilters={exportFilters}
            />
        </div>
    );
};

export default PaymentSlip;
