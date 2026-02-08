import { useLocale } from '@/i18n';
import dayjs from 'dayjs';
import { useState } from 'react';

import DateRangeFilter from '@/components/custom-range-picker';

import MoneyTrend from './components/money-trend';
import SummaryInfo from './components/summary';
import SummaryOrder from './components/summary-order';
import TopCustomer from './components/top-customer';
import TopCustomerDebt from './components/top-customer-debt';
import TopSelling from './components/top-selling';

const Index = () => {
    const { t } = useLocale();
    const [filter, setFilter] = useState<{ from: string; to: string }>({
        from: dayjs().startOf('day').toISOString(),
        to: dayjs().endOf('day').toISOString(),
    });

    return (
        <div className="h-full w-full mt-[-10px] overflow-y-auto">
            <div className="xs:h-auto w-full pt-5 px-2 md:px-10">
                <div className="bg-white shadow-lg h-full w-full p-4 rounded-md">
                    <div className="flex justify-between xs:block">
                        <div className="font-medium text-lg">{t('dashboard.overview.title')}</div>
                        <div className="flex gap-2">
                            <DateRangeFilter
                                onChange={({ fromDate, toDate }) => {
                                    setFilter({
                                        from: fromDate?.toISOString()!,
                                        to: toDate?.toISOString()!,
                                    });
                                }}
                                isDashboard
                            />
                            {/* <div className="flex items-center justify-center">{getTimeRange()}</div>
                            <Select
                                className="w-32"
                                placeholder={t('dashboard.overview.time_range')}
                                options={DashboardTimeRangeOptions.map(option => ({ label: t(option.label), value: option.value }))}
                                onChange={value => {
                                    onChangeTimeRange(value);
                                }}
                                value={selectedTime}
                            /> */}
                        </div>
                    </div>
                    <SummaryInfo from={filter.from} to={filter.to} />
                </div>
            </div>
            <div className="p-2 md:p-10 w-full pt-2">
                <div className="grid grid-cols-2 grid-rows-2 gap-4 xs:block">
                    <div className="shadow rounded-md flex justify-between flex-col bg-white">
                        <SummaryOrder from={filter.from} to={filter.to} />
                    </div>
                    <div className="shadow rounded-md bg-white">
                        <MoneyTrend from={filter.from} to={filter.to} />
                    </div>
                    <div className="col-span-2 shadow rounded-md flex flex-col bg-white">
                        <TopCustomerDebt from={filter.from} to={filter.to} />
                    </div>
                    {/* <div className="shadow rounded-md flex justify-between flex-col bg-white">
                        <InTransit from={filter.from} to={filter.to} />
                    </div> */}
                    <div className="shadow rounded-md h-full flex flex-col p-4 flex-grow w-full bg-white">
                        <TopSelling from={filter.from} to={filter.to} />
                    </div>
                    <div className="shadow rounded-md flex flex-col bg-white">
                        <TopCustomer from={filter.from} to={filter.to} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Index;
