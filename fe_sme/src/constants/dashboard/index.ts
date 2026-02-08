export enum TimeRangeValues {
    TODAY = 'today',
    YESTERDAY = 'yesterday',
    CURRENT_WEEK = 'current_week',
    CURRENT_MONTH = 'current_month',
    LAST_MONTH = 'last_month',
    CURRENT_YEAR = 'current_year',
    LAST_YEAR = 'last_year',
    CUSTOM = 'custom',
}

export const DashboardTimeRangeOptions = [
    {
        label: 'dashboard.overview.time_range.today',
        value: TimeRangeValues.TODAY,
    },
    {
        label: 'dashboard.overview.time_range.yesterday',
        value: TimeRangeValues.YESTERDAY,
    },
    {
        label: 'dashboard.overview.time_range.current_week',
        value: TimeRangeValues.CURRENT_WEEK,
    },
    {
        label: 'dashboard.overview.time_range.last_month',
        value: TimeRangeValues.LAST_MONTH,
    },
    {
        label: 'dashboard.overview.time_range.current_month',
        value: TimeRangeValues.CURRENT_MONTH,
    },
    {
        label: 'dashboard.overview.time_range.current_year',
        value: TimeRangeValues.CURRENT_YEAR,
    },
    {
        label: 'dashboard.overview.time_range.last_year',
        value: TimeRangeValues.LAST_YEAR,
    },
    {
        label: 'dashboard.overview.time_range.custom',
        value: TimeRangeValues.CUSTOM,
    },
];
