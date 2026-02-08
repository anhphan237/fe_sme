import { useLocale } from '@/i18n';
import Carousel from 'antd/lib/carousel';

import login1 from '@/assets/background/login-1.png';
import login2 from '@/assets/background/login-2.png';
import login3 from '@/assets/background/login-3.png';
import AppLogo from '@/assets/logo/exps-removebg.png';

const CompanyInfoSection: React.FC = () => {
    const { t } = useLocale();
    return (
        <div className="lg:col-span-2 overflow-hidden rounded-b-3xl lg:rounded-t-3xl">
            <div className='flex flex-col justify-center h-full'>
                <Carousel autoplay={true} autoplaySpeed={5000}>
                    <div className="flex items-center justify-center relative">
                        <img src={login1} alt="Human Resource 1" className="object-cover h-full w-full rounded-b-3xl lg:rounded-t-3xl shadow-lg" />
                        <div className="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 backdrop-blur-xl p-10 pt-2 rounded-b-3xl lg:rounded-t-3xl flex flex-col items-center justify-center">
                            <img src={AppLogo} alt="logo company" className="ml-3 w-60 h-auto" />
                            <p className="text-white font-bold text-sm md:text-lg xl:text-2xl uppercase text-center">{t('login.title_1')}</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-center relative">
                        <img src={login2} alt="Human Resource 2" className="object-cover h-full w-full rounded-b-3xl lg:rounded-t-3xl shadow-lg" />
                        <p className="absolute mb-2 bottom-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-bold text-sm md:text-lg xl:text-2xl text-center w-full">
                            {t('login.title_2')}
                        </p>
                    </div>
                    <div className="flex items-center justify-center relative">
                        <img src={login3} alt="Human Resource 3" className="object-cover h-full w-full rounded-b-3xl lg:rounded-t-3xl shadow-lg" />
                        <p className="absolute mb-2 bottom-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-bold text-sm md:text-lg xl:text-2xl text-center w-full">
                            {t('login.title_3')}
                        </p>
                    </div>
                </Carousel>
            </div>
        </div>
    );
};

export default CompanyInfoSection;
