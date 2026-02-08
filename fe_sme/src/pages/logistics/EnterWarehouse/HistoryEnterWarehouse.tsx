import { apiRequestApproveSaleContract } from '@/api/contract.api';
import { apiDeleteEnterWarehouse, apiSearchEnterWarehouse, apiUpdateEnterWarehouse } from '@/api/logistics.api';
import { ParamsGetList } from '@/api/request';
import { AppRouters, DefaultMappingPermission } from '@/constants';
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
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { REQUEST_APPROVE_CODE } from '@/pages/sales/components/RequestApproveModal';

import BaseButton from '@/components/button';
import Search from '@/components/search';
import EnterWarhouseTable from '@/components/table';
import { notify } from '@/components/toast-message';

import { setBreadCrumbs } from '@/stores/global.store';

import { formatDateTime } from '@/utils/format-datetime';
import { InputHelper, formatNumber, getWarehouseTransactionInfo, handleCommonError } from '@/utils/helpers';

import { GOODS_RECEIPT_ISSUE_TYPE } from '@/constants/logistics';

import { IAddEditWarehouse } from '@/interface/logistics';

import useCheckIsFullPermission from '@/hooks/useCheckIsFullPermission';
import ConfirmStatus from '../components/ConfirmStatus';

const { RangePicker } = DatePicker;

const { Column } = EnterWarhouseTable;

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
}

const HistoryEnterWarehouse = () => {
    const { t } = useLocale();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { id } = useParams<{ id?: string }>();
    const isFullPermission = useCheckIsFullPermission(DefaultMappingPermission[AppRouters.HISTORY_ENTER_WAREHOUSE]);
    const [requestingApprove, setRequestingApprove] = useState(false);
    const [recordData, setRecordData] = useState<IAddEditWarehouse>();
    const [currentStatus, setCurrentStatus] = useState<number>();
    const [warehouseInfo, setWarehouseInfo] = useState<IWarehouseTransactionInfoValue>({
        totalQuantity: 0,
        remainingQuantity: 0,
        processedQuantity: 0,
        orderName: '',
    });

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
            const res = await apiSearchEnterWarehouse(cleanFilter);
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

    const handleDelete = async (recordId: string) => {
        const res = await apiDeleteEnterWarehouse(recordId);
        if (res.succeeded) {
            notify.success(t('message.delete_success'));
            refetch();
        } else notify.error(t('message.delete_failed'));
    };

    const handleAddEdit = async (data: IAddEditWarehouse) => {
        try {
            const params = {
                ...data,
                type: GOODS_RECEIPT_ISSUE_TYPE.GOODS_RECEIPT,
            };

            delete params?.customer?.currentCustomer;
            const res = await apiUpdateEnterWarehouse(params);
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
                <div className="flex gap-2 mb-2">
                    <BaseButton
                        type="primary"
                        label={t('global.back')}
                        icon={<LeftOutlined />}
                        onClick={() => navigate(AppRouters.ENTER_WAREHOUSE)}
                    />
                    {(data?.statistic?.totalQuantity <= 0 || data?.statistic?.processedQuantity < data?.statistic?.totalQuantity) && (
                        <BaseButton
                            onClick={() =>
                                navigate(`${AppRouters.ENTER_WAREHOUSE}/${id}/add`, {
                                    state: {
                                        id: id,
                                        nameOrder: warehouseInfo?.orderName,
                                    },
                                })
                            }
                            icon={<FileAddOutlined />}
                            label="Add new"
                        />
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
                    {`${t('contract.purchase')}: `}
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
                        {`${t('logistics.enter_warehouse.received')}: `}
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
                        {`${t('logistics.enter_warehouse.unreceived')}: `}
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

            <EnterWarhouseTable<ColumnType>
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
                    key="index"
                    onCell={() => ({ style: { width: 50, maxWidth: 50 } })}
                    onHeaderCell={() => ({ style: { width: 50 } })}
                    fixed="left"
                    render={(_, __, index: number) => (
                        <div className="flex items-center justify-center mb-0">{(filter.pageNumber - 1) * filter.pageSize + (index + 1)}</div>
                    )}
                />
                <Column
                    title={t('sales.contract_number')}
                    dataIndex="invoice"
                    width={140}
                    onCell={() => ({ style: { width: 140, maxWidth: 140 } })}
                    onHeaderCell={() => ({ style: { width: 140 } })}
                    key="invoice"
                    fixed="left"
                    render={(_, record: ColumnType) => {
                        return (
                            <div className="text-blue-500 font-medium">
                                <span
                                    className="cursor-pointer"
                                    onClick={() => {
                                        navigate(`${AppRouters.ENTER_WAREHOUSE}/${id}/${record.id}`);
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
                    dataIndex="invoiceDate"
                    width={140}
                    onCell={() => ({ style: { width: 140, maxWidth: 140 } })}
                    onHeaderCell={() => ({ style: { width: 140 } })}
                    key="invoiceDate"
                    render={(_, record: ColumnType) => formatDateTime(record?.invoiceDate, 'DD-MM-YYYY')}
                />
                <Column
                    width={180}
                    title={t('logistics.enter_warehouse.total_quantity')}
                    dataIndex="totalQuantity"
                    key="totalQuantity"
                    align="right"
                    onCell={() => ({ style: { width: 180 } })}
                    onHeaderCell={() => ({ style: { width: 180 } })}
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
                    align="center"
                    // title={t('Action')}
                    onCell={() => ({ style: { width: 80 } })}
                    onHeaderCell={() => ({ width: 80 })}
                    render={(_, record: IAddEditWarehouse) => (
                        <div className="flex items-center justify-center gap-4">
                            {isFullPermission && record?.status !== LogisticStatusEnum.CANCELED && record?.status !== LogisticStatusEnum.COMPLETED && (
                                <Popconfirm
                                    title={t('logistics.enter_warehouse.popup.cancel_information')}
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
            </EnterWarhouseTable>

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

export default HistoryEnterWarehouse;
