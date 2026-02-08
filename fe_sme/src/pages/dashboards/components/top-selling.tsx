import { apiGetDashboardTopSelling } from '@/api/dashboard.api';
import { AppRouters, ENV_CONFIG } from '@/constants';
import { useLocale } from '@/i18n';
import { AppstoreOutlined, BarsOutlined } from '@ant-design/icons';
import Segmented from 'antd/es/segmented';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import Image from '@/components/image';

import Placeholder from '@/assets/dashboard/placeholder.png';

import { ITopProductData, ITopSellingData } from '@/interface/dashboard';

const TrendingProduct = React.memo(({ topSelling }: { topSelling: ITopSellingData }) => {
    const { t } = useLocale();

    const getImage = (img: string) => {
        if (img) {
            return <Image src={ENV_CONFIG.STORAGE + img} className="!h-10 !w-16" previewMaskText="" />;
        }
        return <img src={Placeholder} alt="" className="h-10 w-16" />;
    };

    return (
        <div className="flex items-center p-4 border rounded-lg shadow-sm bg-white w-full xs:overflow-y-auto">
            <div className="flex items-center gap-4">
                <div className="text-green-600 text-2xl font-bold">{topSelling.ranking}</div>
                <div className="flex items-center justify-center">{getImage(topSelling?.image || '')}</div>
            </div>

            <div className="flex-1 ml-4">
                <Link
                    to={`${AppRouters.DASHBOARDS}`}
                    className="text-blue-500 font-medium hover:underline"
                    target="_blank"
                >
                    {topSelling.productName}
                </Link>
                <div className="flex items-center justify-evenly mt-1 text-gray-500 text-sm">
                    <div className="w-full">{topSelling.rate}%</div>
                    <div className="w-full">
                        {topSelling.totalQuantity} {t('menu.product')}
                    </div>
                    <div className="w-full">
                        {topSelling.totalCount} {t('Quotation')}
                    </div>
                </div>
            </div>
        </div>
    );
});

type Props = {
    from: string;
    to: string;
};

const TopSelling: React.FC<Props> = (props: Props) => {
    const { from, to } = props;
    const { t } = useLocale();

    const [topSellingData, setTopSellingData] = useState<ITopProductData>();
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        if (!from || !to) return;
        setTimeout(() => {
            initData();
        }, 500);
    }, [from, to]);

    const initData = async () => {
        const resp = await apiGetDashboardTopSelling(from, to);
        const data: ITopProductData = resp?.data || [];
        setTopSellingData(data);
    };

    return (
        <>
            <div className="flex justify-between items-center4 px-3">
                <div className="font-medium text-lg">{t('dashboard.trending.title')}</div>
                <div className="shadow rounded">
                    <Segmented
                        className="bg-gray-100"
                        options={[
                            {
                                label: (
                                    <>
                                        <BarsOutlined /> {t('dashboard.trending.best_seller')}
                                    </>
                                ),
                                value: 0,
                            },
                            {
                                label: (
                                    <>
                                        <AppstoreOutlined /> {t('dashboard.trending.refund')}
                                    </>
                                ),
                                value: 1,
                            },
                        ]}
                        value={activeTab}
                        onChange={setActiveTab}
                    />
                </div>
            </div>
            <div className="flex flex-col gap-2 h-auto grow px-4 py-6 w-full">
                {activeTab === 0 && topSellingData?.saleProducts?.map((value, idx) => <TrendingProduct topSelling={value} key={idx} />)}
                {activeTab === 1 && topSellingData?.returnProducts?.map((value, idx) => <TrendingProduct topSelling={value} key={idx} />)}
            </div>
        </>
    );
};

export default React.memo(TopSelling);
