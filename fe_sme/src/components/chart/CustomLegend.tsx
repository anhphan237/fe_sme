import { useLocale } from '@/i18n';
import clsx from 'clsx';
import { useState } from 'react';

interface LegendItem {
    name: string;
    value: string | number;
}
interface CustomLegendProps<T> {
    chartRef?: React.MutableRefObject<any>;
    wrapperClassName?: string;
    onItemClick?: (data: { type: string; data: T }) => void;
    data: T[];
}
const CustomLegend = <T extends LegendItem = LegendItem>({ chartRef, data, wrapperClassName, onItemClick }: CustomLegendProps<T>) => {
    const { t } = useLocale();
    const chartInstance = chartRef?.current?.getEchartsInstance();
    const [selectedItems, setSelectedItems] = useState<{ [key in string]: boolean }>(data.reduce((acc, item) => ({ ...acc, [item.name]: true }), {}));

    const getColor = (index: number) => {
        const colors = [
            '#5470c6',
            '#91cc75',
            '#fac858',
            '#ee6666',
            '#73c0de',
            '#3ba272',
            '#fc8452',
            '#9a60b4',
            '#ea7ccc',
            '#ff9f7f',
            '#ffdb5c',
            '#37a2da',
            '#32c5e9',
            '#9fe6b8',
            '#ff9f7f',
            '#fb7293',
            '#e062ae',
            '#e690d1',
            '#96bfff',
        ];
        return colors[index % colors.length];
    };

    const handleClick = (name: string) => {
        if (!chartInstance) return;
        const legend = chartInstance.getOption().legend?.[0];
        const selected = legend.selected;
        const newStatus = !selectedItems[name];
        selected[name] = newStatus;
        chartInstance.dispatchAction({
            type: 'legendToggleSelect',
            name: name,
        });
        setSelectedItems({ ...selectedItems, [name]: newStatus });
    };

    const handleMouseEnter = (name: string) => {
        if (!chartInstance) return;
        chartInstance.dispatchAction({
            type: 'highlight',
            name: name,
        });
    };

    const handleMouseLeave = (name: string) => {
        if (!chartInstance) return;
        chartInstance.dispatchAction({
            type: 'downplay',
            name: name,
        });
    };

    return (
        <div className={clsx('flex flex-col gap-1', wrapperClassName)}>
            {data.map((item, index: number) => (
                <div
                    key={item.name}
                    className={clsx(
                        'flex items-center justify-end gap-2 cursor-pointer',
                        selectedItems[item.name] === false ? 'opacity-50 !text-gray-500' : '',
                    )}
                    onMouseEnter={() => handleMouseEnter(item.name)}
                    onMouseLeave={() => handleMouseLeave(item.name)}
                >
                    <span title={t('dashboard.click.detail')} className="hover:font-semibold hover:underline" onClick={() => onItemClick?.({ type: 'name', data: item })}>
                        {`${t(item.name)}: ${item.value}`}
                    </span>
                    <span
                        className={clsx('w-6 h-4 inline-block rounded', selectedItems[item.name] === false ? '!bg-gray-500' : '')}
                        style={{ backgroundColor: getColor(index) }}
                        onClick={() => handleClick(item.name)}
                    />
                </div>
            ))}
        </div>
    );
};

export default CustomLegend;
