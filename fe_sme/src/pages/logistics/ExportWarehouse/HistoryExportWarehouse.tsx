import { apiRequestApproveSaleContract } from '@/api/contract.api';
import { apiExport } from '@/api/file.api';
import { apiDeleteExportWarehouse, apiSearchExportWarehouse, apiUpdateExportWarehouse } from '@/api/logistics.api';
import { ParamsGetList } from '@/api/request';
import { AppRouters, DefaultMappingPermission, DefaultValues } from '@/constants';
import BaseModal from '@/core/components/Modal/BaseModal';
import ApproveTag from '@/core/components/Status/ApproveTag';
import { COMMON_STATUS } from '@/core/components/Status/StatusTag';
import { LogisticStatusEnum } from '@/enums/LogisticStatus';
import { useLocale } from '@/i18n';
import { useAppDispatch } from '@/stores';
import { IWarehouseTransactionInfoValue } from '@/types';
import { FileAddOutlined, LeftOutlined } from '@ant-design/icons';
import { faBan, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useQuery } from '@tanstack/react-query';
import { DatePicker, Popconfirm, Tooltip } from 'antd';
import clsx from 'clsx';
import { debounce } from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { REQUEST_APPROVE_CODE } from '@/pages/sales/components/RequestApproveModal';

import BaseButton from '@/components/button';
import Search from '@/components/search';
import ProductTable from '@/components/table';
import { notify } from '@/components/toast-message';

import { setBreadCrumbs } from '@/stores/global.store';

import useCheckIsFullPermission from '@/hooks/useCheckIsFullPermission';

import { formatDateTime } from '@/utils/format-datetime';
import { FileHelper, InputHelper, formatNumber, getWarehouseTransactionInfo, handleCommonError } from '@/utils/helpers';

import { GOODS_RECEIPT_ISSUE_TYPE } from '@/constants/logistics';

import { ContractDetail } from '@/interface/contract';
import { IAddEditWarehouse } from '@/interface/logistics';

import ConfirmStatus from '../components/ConfirmStatus';

const { Column } = ProductTable;
const { RangePicker } = DatePicker;

interface ColumnType {
    id: string;
    name: string;
    code: string;
    invoice: string;
    totalAmount: number;
    invoiceDate: string;
    warehouse: {
        warehouseName: string;
    };
    customer: {
        customerTaxCode: string;
        customerContactPerson: string;
        customerWarehouseName: string;
        customerName: string;
        customerContactPersonPhone: string;
    };
    description?: string;
    status: COMMON_STATUS & LogisticStatusEnum.CANCELED;
    details: ContractDetail[];
}

const HistoryExportWarehouse = () => {
    const { t } = useLocale();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const isFullPermission = useCheckIsFullPermission(DefaultMappingPermission[AppRouters.HISTORY_EXPORT_WAREHOUSE]);
    const { id } = useParams<{ id?: string }>();
    const [recordData, setRecordData] = useState<IAddEditWarehouse>();
    const [currentStatus, setCurrentStatus] = useState<number>();
    const [filter, setFilter] = useState<ParamsGetList>({
        pageSize: 10,
        pageNumber: 1,
        search: '',
        range: {
            from: undefined,
            to: undefined,
        },
        contractId: id || '',
        // filters: [
        //     {
        //         key: 'contractId',
        //         value: [id || ''] as string[],
        //     },
        // ],
    });
    const [requestingApprove, setRequestingApprove] = useState(false);
    const [warehouseInfo, setWarehouseInfo] = useState<IWarehouseTransactionInfoValue>({
        totalQuantity: 0,
        remainingQuantity: 0,
        processedQuantity: 0,
        orderName: '',
    });
    const RequestApproveModalRef = useRef<any>(null);

    useEffect(() => {
        if (!id) return;
        const newWarehouseInfo = getWarehouseTransactionInfo(id);
        if (newWarehouseInfo) {
            setWarehouseInfo(newWarehouseInfo);
            dispatch(
                setBreadCrumbs({
                    [id]: `${newWarehouseInfo.orderName}`,
                }),
            );
        }
    }, [id]);

    const { data, refetch } = useQuery({
        queryKey: ['getListGoodsIssue', filter],
        queryFn: async () => {
            const cleanFilter = { ...filter };
            if (!cleanFilter.range?.from || !cleanFilter.range?.to) {
                delete cleanFilter.range;
            }
            const res = await apiSearchExportWarehouse(cleanFilter);
            return res;
        },
    });

    const requestApprove = async (record: ColumnType) => {
        setRequestingApprove(true);
        try {
            const { description, approverUserId } = await RequestApproveModalRef.current.open();
            const response = await apiRequestApproveSaleContract({
                contractId: record.id,
                approverUserId,
                description,
            });
            if (!response.succeeded) {
                throw new Error(t('global.message.error'));
            }
            refetch();
            notify.success(t('sales.request_approve_success'));
        } catch (error: any) {
            if (error?.code === REQUEST_APPROVE_CODE.CANCELED) return;
            notify.error(t('global.message.error'));
        } finally {
            setRequestingApprove(false);
        }
    };

    const debouncePrintWarehouse = useCallback(
        debounce(async (id: string) => {
            if (id) {
                try {
                    const res = await apiExport({ path: 'goodsIssue', goodsIssueId: id });
                    await FileHelper.downloadFileFromResponse(res as any);
                    notify.success(t('global.message.export_success'));
                } catch (err) {
                    notify.error('global.message.export_failed');
                }
            }
        }, DefaultValues.DEBOUNCE_DELAY),
        [],
    );

    const handleDelete = async (recordId: string) => {
        const res = await apiDeleteExportWarehouse(recordId);
        if (res.succeeded) {
            notify.success(t('message.delete_success'));
            refetch();
        } else notify.error(t('message.delete_failed'));
    };

    const handleAddEdit = async (data: IAddEditWarehouse) => {
        try {
            const params = {
                ...data,
                type: GOODS_RECEIPT_ISSUE_TYPE.GOODS_ISSUE,
            };

            delete params?.customer?.currentCustomer;
            const res = await apiUpdateExportWarehouse(params);
            if (res.succeeded) {
                notify.success(t('message.update_success'));
                refetch();
            } else throw res;
        } catch (error) {
            handleCommonError(error, t);
        }
    };

    const handleCloseConfirm = () => {
        setRecordData(undefined);
        setCurrentStatus(undefined);
    };

    const handleOk = async () => {
        if (currentStatus && recordData) {
            await handleAddEdit({ ...recordData, status: currentStatus });
            await refetch();

            handleCloseConfirm();
        }
    };

    return (
        <div className="h-full flex flex-col p-4">
            <div className="flex justify-between mx-2 gap-2">
                <div className="flex items-center gap-2 mb-2">
                    <BaseButton
                        type="primary"
                        label={t('global.back')}
                        icon={<LeftOutlined />}
                        onClick={() => navigate(AppRouters.EXPORT_WAREHOUSE)}
                    />
                    {(data?.statistic?.totalQuantity <= 0 || data?.statistic?.processedQuantity < data?.statistic?.totalQuantity) && (
                        <BaseButton onClick={() => navigate(`${AppRouters.EXPORT_WAREHOUSE}/${id}/add`)} icon={<FileAddOutlined />} label="Add new" />
                    )}
                </div>
                <div className="flex gap-2 w-1/2 justify-end">
                    <div>
                        <RangePicker
                            onChange={dates => {
                                if (!dates || !dates[0] || !dates[1]) {
                                    setFilter(prev => {
                                        const { range, ...rest } = prev;
                                        return rest;
                                    });
                                    return;
                                }

                                setFilter(prev => ({
                                    ...prev,
                                    pageNumber: 1,
                                    range: {
                                        from: dates[0]?.startOf('day')?.toISOString(),
                                        to: dates[1]?.endOf('day')?.toISOString(),
                                    },
                                }));
                            }}
                            allowClear
                            placeholder={[t('global.from_date'), t('global.to_date')]}
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
            </div>
            <div className="flex justify-between items-center w-full text-lg px-2">
                <span>
                    {`${t('contract.sales')}: `}
                    <strong className="text-blue-600">{warehouseInfo?.orderName}</strong>
                </span>
                <div className="flex gap-8 p-2">
                    <span>
                        {`${t('logistics.enter_warehouse.total_quantity')}: `}
                        <strong
                            className={clsx({
                                'text-green-600': data?.statistic?.totalQuantity! > 0,
                                'text-red-600': data?.statistic?.totalQuantity! < 0,
                            })}
                        >
                            {formatNumber(data?.statistic?.totalQuantity!)}
                        </strong>
                    </span>
                    <span>
                        {`${t('logistics.exit_warehouse.exported')}: `}
                        <strong
                            className={clsx({
                                'text-green-600': data?.statistic?.processedQuantity! > 0,
                                'text-red-600': data?.statistic?.processedQuantity! < 0,
                            })}
                        >
                            {formatNumber(data?.statistic?.processedQuantity!)}
                        </strong>
                    </span>
                    <span>
                        {`${t('logistics.exit_warehouse.unexported')}: `}
                        <strong
                            className={clsx({
                                'text-green-600': data?.statistic?.remainingQuantity! > 0,
                                'text-red-600': data?.statistic?.remainingQuantity! < 0,
                            })}
                        >
                            {formatNumber(data?.statistic?.remainingQuantity!)}
                        </strong>
                    </span>
                </div>
            </div>
            <ProductTable<ColumnType>
                dataSource={data?.data || []}
                rowKey={record => record.id}
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
                    title={<div className="flex justify-center items-center">{t('category.list.index')}</div>}
                    dataIndex="index"
                    width={50}
                    fixed="left"
                    onCell={() => ({ style: { width: 50, maxWidth: 50 } })}
                    onHeaderCell={() => ({ style: { width: 50 } })}
                    key="index"
                    render={(_, __, index: number) => (
                        <div className="flex items-center justify-center mb-0">{(filter.pageNumber - 1) * filter.pageSize + (index + 1)}</div>
                    )}
                />
                <Column
                    title={t('sales.contract_number')}
                    dataIndex="invoice"
                    width={140}
                    fixed="left"
                    onCell={() => ({ style: { width: 140, maxWidth: 140 } })}
                    onHeaderCell={() => ({ style: { width: 140 } })}
                    key="invoice"
                    render={(_, record: ColumnType) => {
                        return (
                            <div className="text-blue-500 font-medium">
                                <span
                                    className="cursor-pointer"
                                    onClick={() => {
                                        navigate(`${AppRouters.EXPORT_WAREHOUSE}/${id}/${record.id}`);
                                    }}
                                >
                                    {record?.invoice}
                                </span>
                            </div>
                        );
                    }}
                />
                <Column
                    ellipsis
                    title={t('logistics.enter_warehouse.document_date')}
                    width={160}
                    onCell={() => ({ style: { width: 160, maxWidth: 160 } })}
                    onHeaderCell={() => ({ style: { width: 160 } })}
                    dataIndex="invoiceDate"
                    key="invoiceDate"
                    render={(_, record: ColumnType) => formatDateTime(record?.invoiceDate, 'DD-MM-YYYY')}
                />
                <Column
                    width={180}
                    onCell={() => ({ style: { width: 180 } })}
                    onHeaderCell={() => ({ style: { width: 180 } })}
                    title={t('logistics.enter_warehouse.total_quantity')}
                    dataIndex="totalQuantity"
                    key="totalQuantity"
                    align="right"
                    render={val => {
                        return val ? InputHelper.formatNumber(val) : '-';
                    }}
                />
                <Column
                    title={t('global.status')}
                    ellipsis
                    width={160}
                    onCell={() => ({ style: { width: 160 } })}
                    onHeaderCell={() => ({ style: { width: 160 } })}
                    dataIndex="status"
                    align="center"
                    fixed="right"
                    key="status"
                    render={value => <ApproveTag value={value} />}
                />
                <Column
                    width={80}
                    fixed="right"
                    onCell={() => ({ style: { width: 80 } })}
                    onHeaderCell={() => ({ width: 80 })}
                    render={(_, record: IAddEditWarehouse) => (
                        <div className="flex items-center justify-center gap-4">
                            {isFullPermission &&
                                record?.status !== LogisticStatusEnum.CANCELED &&
                                record?.status !== LogisticStatusEnum.COMPLETED && (
                                    <Popconfirm
                                        title={t('logistics.export_warehouse.popup.cancel_information')}
                                        onConfirm={() => handleDelete(record.id)}
                                        okText={t('global.popup.ok')}
                                        cancelText={t('global.popup.reject')}
                                        placement="left"
                                    >
                                        <FontAwesomeIcon icon={faBan} className="cursor-pointer text-red-600 flex gap-1" />
                                    </Popconfirm>
                                )}
                            {isFullPermission && record.status !== LogisticStatusEnum.CANCELED && record.status !== LogisticStatusEnum.COMPLETED && (
                                <Tooltip title={t('logistics.order.confirmation')}>
                                    <FontAwesomeIcon
                                        onClick={() => setRecordData(record)}
                                        icon={faCheckCircle}
                                        className="cursor-pointer flex gap-1"
                                    />
                                </Tooltip>
                            )}
                        </div>
                    )}
                />
            </ProductTable>

            <BaseModal
                children={<ConfirmStatus status={currentStatus} setStatus={setCurrentStatus} />}
                title={t('logistics.order.confirmation')}
                open={!!recordData}
                onCancel={handleCloseConfirm}
                onOk={handleOk}
            />
        </div>
    );
};

export default HistoryExportWarehouse;
