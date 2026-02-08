import { useLocale } from '@/i18n';
import { Col } from 'antd';

const DividerLabel = ({ label }: { label: string }) => {
    const { t } = useLocale();
    return (
        <Col span={24} className="flex justify-center items-center gap-2 mt-4">
            <div className="min-w-fit font-bold">{t(label)}</div>
            <div className="h-[1px] w-full bg-gray-400 mt-1" />
        </Col>
    );
};

export default DividerLabel;
