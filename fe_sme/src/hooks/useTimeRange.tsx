import { TimeRangeValues } from '@/constants';
import { useLocale } from '@/i18n';
import { formatDateTime, getFromAndToByTimeRange } from '@/utils/format-datetime';
import DatePicker from 'antd/es/date-picker';
import moment, { Moment } from 'moment';
import { useEffect, useState } from 'react';

const useTimeRange = (defaultTimeRange: boolean = true) => {
    const [selectedTime, setSelectedTime] = useState<TimeRangeValues>();
    const [timeFrom, setTimeFrom] = useState<Moment | null>();
    const [timeTo, setTimeTo] = useState<Moment | null>();

    const { t } = useLocale();

    useEffect(() => {
        if (defaultTimeRange) {
            setSelectedTime(TimeRangeValues.TODAY);
            const { timeFrom: tF, timeTo: tT } = getFromAndToByTimeRange(TimeRangeValues.TODAY);

            setTimeFrom(tF);
            setTimeTo(tT);
        }
    }, []);

    const getTimeRange = (onlyCustom = false) => {
        if (selectedTime === TimeRangeValues.CUSTOM) {
            return (
                <DatePicker.RangePicker
                    onChange={values => {
                        const from = values?.[0]?.toString();
                        const to = values?.[1]?.toString();
                        setTimeFrom(moment(from));
                        setTimeTo(moment(to));
                    }}
                />
            );
        }

        if (!timeFrom || !timeTo || onlyCustom) return;
        return (
            <>
                <b>{formatDateTime(timeFrom.toString(), 'DD-MM-YYYY')}</b> 
                <span className='mx-1'>{t('dashboard.overview.time_range.to')} </span>
                <b>{formatDateTime(timeTo.toString(), 'DD-MM-YYYY')}</b>
            </>
        );
    };

    const onChangeTimeRange = (value: TimeRangeValues) => {
        setSelectedTime(value);
        if (!value) {
            setTimeFrom(null);
            setTimeTo(null);
            return;
        }
        if (value === TimeRangeValues.CUSTOM) {
            setTimeFrom(null);
            setTimeTo(null);
            return;
        }
        const { timeFrom: tF, timeTo: tT } = getFromAndToByTimeRange(value);

        setTimeFrom(tF);
        setTimeTo(tT);
    };

    return {
        selectedTime,
        setSelectedTime,
        timeFrom,
        timeTo,
        setTimeFrom,
        setTimeTo,
        getTimeRange,
        onChangeTimeRange,
    };
};

export default useTimeRange;
