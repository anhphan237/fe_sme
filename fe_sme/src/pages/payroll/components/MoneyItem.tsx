import { formatMoney } from '@/utils/helpers';

type _T_Props = {
    title: string;
    money: number;
    isPrimary?: boolean
};

const MoneyItem = ({ money, title, isPrimary = false }: _T_Props) => {
    return (
        <div className="relative flex flex-col items-center p-2 min-w-[180px] bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-2 py-1 bg-white shadow text-center font-medium rounded-lg mb-4 absolute top-[-15px] right-4">
                <span className="text-xs whitespace-normal text-center ">{title}</span>
            </div>
            <strong className={`${isPrimary ? 'text-colorPrimary' : 'text-black'} text-base my-2`}>{formatMoney(money)}</strong>
        </div>
    );
};

export default MoneyItem;
