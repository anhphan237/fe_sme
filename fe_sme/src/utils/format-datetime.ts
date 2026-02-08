import { FilterDashboardDataDatetimeFormat, TimeRangeValues } from '@/constants';
import moment, { Moment } from 'moment';
import type { SharedTimeProps } from 'rc-picker/lib/interface';

export const formatDateTime = (date: string | Moment, format: string = 'DD-MM-YYYY (HH:mm A)') => {
    if (date) {
        return moment.utc(date).add(7, 'hours').format(format);
    }

    return '-';
};

export const getFromAndToByTimeRange = (timeRange: TimeRangeValues) => {
    let timeTo;
    let timeFrom;
    switch (timeRange) {
        case TimeRangeValues.TODAY:
            timeFrom = moment().startOf('day');
            timeTo = moment().endOf('day');
            break;
        case TimeRangeValues.YESTERDAY:
            timeFrom = moment().subtract(1, 'day').startOf('day');
            timeTo = moment().subtract(1, 'day').endOf('day');
            break;
        case TimeRangeValues.CURRENT_WEEK:
            timeFrom = moment().startOf('week');
            timeTo = moment().endOf('week');
            break;
        case TimeRangeValues.CURRENT_MONTH:
            timeFrom = moment().startOf('month');
            timeTo = moment().endOf('month');
            break;
        case TimeRangeValues.LAST_MONTH:
            timeFrom = moment().subtract(1, 'month').startOf('month');
            timeTo = moment().subtract(1, 'month').endOf('month');
            break;
        case TimeRangeValues.CURRENT_YEAR:
            timeFrom = moment().startOf('year');
            timeTo = moment().endOf('year');
            break;
        case TimeRangeValues.LAST_YEAR:
            timeFrom = moment().subtract(1, 'year').startOf('year');
            timeTo = moment().subtract(1, 'year').endOf('year');
            break;
        default:
            timeFrom = moment().startOf('day');
            timeTo = moment().endOf('day');
            break;
    }
    return {
        timeTo,
        timeFrom,
    };
};

export const getFromAndToForUTCtime = (fromT: Moment, toT: Moment) => {
    const from = moment.utc(fromT).format(FilterDashboardDataDatetimeFormat);
    const to = moment.utc(toT).format(FilterDashboardDataDatetimeFormat);
    return { from, to };
};

export const convertTimeToInput = (date?: string | Moment): Moment => {
    return moment(date).add(7, 'hours');
};

export const getMinMaxDateDisabledTime = (minDate?: Moment, maxDate?: Moment) => {
    return (current?: Moment): SharedTimeProps<Moment> => {
        if (!current) return {};

        const isSameMinDay = minDate && current.isSame(minDate, 'day');
        const isSameMaxDay = maxDate && current.isSame(maxDate, 'day');

        if (!isSameMinDay && !isSameMaxDay) return {};

        const minHour = minDate?.hour() ?? 0;
        const minMinute = minDate?.minute() ?? 0;
        const minSecond = minDate?.second() ?? 0;

        const maxHour = maxDate?.hour() ?? 23;
        const maxMinute = maxDate?.minute() ?? 59;
        const maxSecond = maxDate?.second() ?? 59;

        return {
            disabledHours: () => {
                const hours: number[] = [];

                for (let h = 0; h < 24; h++) {
                    if (isSameMinDay && h < minHour) hours.push(h);
                    if (isSameMaxDay && h > maxHour) hours.push(h);
                }

                return hours;
            },

            disabledMinutes: (hour: number) => {
                const minutes: number[] = [];

                for (let m = 0; m < 60; m++) {
                    if (isSameMinDay) {
                        if (hour < minHour) minutes.push(m);
                        else if (hour === minHour && m < minMinute) minutes.push(m);
                    }

                    if (isSameMaxDay) {
                        if (hour > maxHour) minutes.push(m);
                        else if (hour === maxHour && m > maxMinute) minutes.push(m);
                    }
                }

                return minutes;
            },

            disabledSeconds: (hour: number, minute: number) => {
                const seconds: number[] = [];

                for (let s = 0; s < 60; s++) {
                    if (isSameMinDay) {
                        if (
                            hour < minHour ||
                            (hour === minHour && minute < minMinute) ||
                            (hour === minHour && minute === minMinute && s < minSecond)
                        ) {
                            seconds.push(s);
                        }
                    }

                    if (isSameMaxDay) {
                        if (
                            hour > maxHour ||
                            (hour === maxHour && minute > maxMinute) ||
                            (hour === maxHour && minute === maxMinute && s > maxSecond)
                        ) {
                            seconds.push(s);
                        }
                    }
                }

                return seconds;
            },
        };
    };
};
