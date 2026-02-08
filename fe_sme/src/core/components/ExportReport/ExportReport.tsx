import { useLocale } from '@/i18n';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DatePicker, Popover } from 'antd';
import { DefaultOptionType } from 'antd/es/select';
import { Select } from 'antd/lib';
import { useState } from 'react';

import BaseButton from '@/components/button';

const { RangePicker } = DatePicker;

interface IFilter {
    range?: { from?: string; to?: string };
    status?: number;
}

interface IProps {
    onExport: (filter: IFilter) => void;
    open: boolean;
    disabled?: boolean;
    setOpen: (val: boolean) => void;
    statusList: DefaultOptionType[];
}

const ExportReport = ({ onExport, open, setOpen, disabled = false, statusList }: IProps) => {
    const { t } = useLocale();
    const [filter, setFilter] = useState<IFilter>({});

    return (
        <Popover
            content={
                <div className="flex flex-col gap-4 p-2">
                    <RangePicker
                        onChange={dates => {
                            if (!dates || !dates[0] || !dates[1]) {
                                setFilter({});
                                return;
                            }
                            setFilter({
                                range: {
                                    from: dates[0]?.toISOString(),
                                    to: dates[1]?.toISOString(),
                                },
                            });
                        }}
                        allowClear
                        placeholder={[t('global.from_date'), t('global.to_date')]}
                        className="w-full"
                    />
                    <div className="flex justify-between gap-2 w-full">
                        <span className="w-full font-medium">{t('global.status')}</span>
                        <Select
                            options={statusList || []}
                            placeholder={t('global.status')}
                            className="w-full"
                            value={filter.status}
                            onChange={val => setFilter({ ...filter, status: val })}
                        />
                    </div>
                    <span>{t('export.note')}</span>
                    <div className="flex gap-2 justify-end w-full">
                        <BaseButton label="global.cancel" onClick={() => setOpen(false)} />
                        <BaseButton
                            label="global.popup.confirm"
                            type="primary"
                            onClick={() => {
                                onExport(filter);
                                setOpen(false);
                            }}
                        />
                    </div>
                </div>
            }
            title={t('export.title')}
            trigger="click"
            open={open}
            onOpenChange={setOpen}
            destroyTooltipOnHide
        >
            <BaseButton label="export.title" disabled={disabled} icon={<FontAwesomeIcon icon={faDownload} />} />
        </Popover>
    );
};

export default ExportReport;
