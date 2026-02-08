import { apiSearchHistoryInteraction, apiSearchHistoryInteractionById } from '@/api/customer.api';
import { ParamsGetList } from '@/api/request';
import StatusTag from '@/core/components/Status/StatusTag';
import { useLocale } from '@/i18n';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState } from 'react';

import BaseButton from '@/components/button';
import DateRangeFilter from '@/components/custom-range-picker';
import Search from '@/components/search';
import HistoryInteractionTable from '@/components/table';

import { formatDateTime } from '@/utils/format-datetime';
import { renderLabelOption } from '@/utils/helpers';

import { IHistoryInteraction } from '@/interface/customer';

import AddEditInteraction from './AddEditInteraction';

const { Column } = HistoryInteractionTable;

interface IProps {
    customerId?: string;
}

const HistoryInteraction = ({ customerId }: IProps) => {
    const { t } = useLocale();
    const [filter, setFilter] = useState<ParamsGetList>({
        pageSize: 10,
        pageNumber: 1,
        search: undefined,
    });
    const [openUpdate, setOpenUpdate] = useState<object | null>(null);

    const { data, refetch } = useQuery({
        queryKey: ['getListHistoryInteraction', filter],
        queryFn: async () => {
            const res = customerId
                ? await apiSearchHistoryInteractionById({ ...filter, customerId }, { loading: false })
                : await apiSearchHistoryInteraction(filter, { loading: false });
            return res;
        },
    });

    return (
        <div
            className={clsx('h-full flex flex-col p-4', {
                '!p-0': !!customerId,
            })}
        >
            <div
                className={clsx('flex justify-end mb-2 mx-2 gap-2', {
                    '!justify-between': !customerId,
                })}
            >
                {!customerId && <BaseButton label={t('Add new')} onClick={() => setOpenUpdate({})} icon={<FontAwesomeIcon icon={faPlus} />} />}
                <div className="flex gap-2">
                    <DateRangeFilter
                        onChange={({ fromDate, toDate }) => {
                            setFilter({
                                ...filter,
                                pageNumber: 1,
                                ...(fromDate ? { range: { from: fromDate.toISOString(), to: toDate?.toISOString() } } : { range: undefined }),
                            });
                        }}
                    />
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

            <HistoryInteractionTable<IHistoryInteraction>
                dataSource={data?.data || []}
                rowKey={record => record.customerId}
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
                    onCell={() => ({ width: 50 })}
                    onHeaderCell={() => ({ style: { width: 50 } })}
                    key="index"
                    render={(_, __, index: number) => (
                        <div className="flex items-center justify-center mb-0">{(filter.pageNumber - 1) * filter.pageSize + (index + 1)}</div>
                    )}
                />
                <Column
                    title={t('order.list.customer')}
                    dataIndex="customerName"
                    width={300}
                    onCell={() => ({ width: 300 })}
                    onHeaderCell={() => ({ style: { width: 300, maxWidth: 350 } })}
                    key="customerName"
                    render={(_, record: IHistoryInteraction) => {
                        return (
                            <div onClick={() => setOpenUpdate(record)} className="text-blue-500 font-medium cursor-pointer max-w-[500px] truncate">
                                {record.customer.name}
                            </div>
                        );
                    }}
                />
                <Column
                    ellipsis
                    width={150}
                    onCell={() => ({ width: 150 })}
                    onHeaderCell={() => ({ style: { width: 150 } })}
                    title={t('history.date')}
                    dataIndex="interactionDate"
                    key="interactionDate"
                    render={(_, record: IHistoryInteraction) => formatDateTime(record.interactionDate)}
                />
                <Column
                    title={t('history.channel')}
                    ellipsis
                    width={100}
                    onCell={() => ({ width: 100 })}
                    onHeaderCell={() => ({ style: { width: 100 } })}
                    align="center"
                    dataIndex="channel"
                    key="channel"
                    render={(_, record: IHistoryInteraction) =>
                        renderLabelOption(record.channel, [
                            {
                                value: 0,
                                label: t('global.email'),
                            },
                            {
                                value: 1,
                                label: t('history.call'),
                            },
                            {
                                value: 2,
                                label: t('history.direct'),
                            },
                        ])
                    }
                />
                <Column
                    title={t('global.steps.content')}
                    ellipsis
                    width={250}
                    onCell={() => ({ width: 250 })}
                    onHeaderCell={() => ({ style: { width: 250 } })}
                    align="right"
                    dataIndex="subject"
                    key="subject"
                    className="max-w-96"
                />
                <Column
                    title={t('history.staff')}
                    ellipsis
                    width={150}
                    onCell={() => ({ width: 150 })}
                    onHeaderCell={() => ({ style: { width: 150 } })}
                    align="right"
                    dataIndex="staff"
                    key="staff"
                    render={(_, record: IHistoryInteraction) => record?.personInCharge?.userName}
                />
                <Column
                    title={t('global.description')}
                    ellipsis
                    width={150}
                    onCell={() => ({ width: 150 })}
                    onHeaderCell={() => ({ style: { width: 150 } })}
                    align="right"
                    dataIndex="description"
                    key="description"
                    className="max-w-96"
                />
                <Column
                    title={t('global.status')}
                    ellipsis
                    width={150}
                    onCell={() => ({ width: 150 })}
                    onHeaderCell={() => ({ style: { width: 150 } })}
                    align="center"
                    fixed="right"
                    dataIndex="remainingAmount"
                    key="remainingAmount"
                    render={(_, record: IHistoryInteraction) => <StatusTag value={record.status} />}
                />
            </HistoryInteractionTable>
            <AddEditInteraction
                onClose={() => {
                    setOpenUpdate(null);
                    refetch();
                }}
                initValue={openUpdate}
                canEdit={!customerId}
            />
        </div>
    );
};

export default HistoryInteraction;
