import { faCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { NotificationItem } from '@/interface/notification';

interface NoticeCardProps {
    item: NotificationItem;
    contentClassName?: string;
    infoClassName?: string;
    onClick?: () => void;
}
const NoticeCard = ({ item, contentClassName, infoClassName, onClick }: NoticeCardProps) => {
    const isRead = item.isRead;
    return (
        <div
            className={`flex items-center rounded gap-2 p-2 ${isRead ? 'cursor-default' : 'hover:bg-gray-100 active:scale-95 cursor-pointer'}`}
            onClick={onClick}
        >
            <FontAwesomeIcon
                icon={faCircle}
                className={`text-[12px] ${isRead ? 'text-transparent border border-gray-400 rounded-full' : 'text-blue-500'}`}
            />
            <div className={`flex flex-col flex-grow max-w-[350px] ${infoClassName}`}>
                <span className="font-semibold max-w-full truncate" title={item.title}>
                    {item.title}
                </span>
                <span className={`text-sm text-gray-500 max-w-full truncate ${contentClassName}`} title={item.contentNotify}>
                    {item.contentNotify}
                </span>
            </div>
        </div>
    );
};

export default NoticeCard;
