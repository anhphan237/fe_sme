import { useLocale } from '@/i18n';
import { Avatar, Form, Spin, Tabs, Tag } from 'antd';

import BaseButton from '@/components/button';

import CurriculumVitae from './components/curriculum-vitae';

const { TabPane } = Tabs;

const Profile = () => {
    const { t } = useLocale();

    return (
        <div className="px-4 h-[calc(100vh-104px)]">
            <Form layout="vertical" className="h-full flex flex-col" preserve>
                <div className="flex gap-4 flex-1 ">
                    <div className="w-1/5 bg-white rounded-lg p-4 flex flex-col gap-10 shadow-sm h-full">
                        <div className="w-full flex flex-col items-center gap-4">
                            <Avatar
                                alt="avatar"
                                src="https://gamek.mediacdn.vn/zoom/600_315/133514250583805952/2025/3/24/avatar1742786758808-17427867593001953659923.png"
                                className="size-28"
                            />
                            <div className="w-full rounded-lg">
                                <div className="text-center">
                                    <h3 className="text-lg font-semibold text-gray-800 truncate">Tran Ha Linh</h3>
                                </div>
                                <div className="flex items-center justify-center gap-2 mt-1 text-sm text-gray-600 opacity-80">
                                    <span>Lập trình viên</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between gap-4">
                                <p className="shrink-0 min-w-[100px]">Mã nhân viên: </p>
                                <Tag>0001987</Tag>
                            </div>
                            <div className="flex justify-between gap-4">
                                <p className="shrink-0 min-w-[100px]">Bộ phận: </p>
                                <p>Phòng kỹ thuật IT</p>
                            </div>
                            <div className="flex justify-between gap-4">
                                <p className="shrink-0 min-w-[100px]">Vị trí công việc: </p>
                                <p>Lập trình viên</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col bg-white rounded-lg p-6 shadow-sm h-full overflow-hidden">
                        <div className="flex-1 overflow-auto pr-2">
                            <Tabs defaultActiveKey="1">
                                <TabPane tab="Sơ yếu lý lịch" key="1">
                                    <CurriculumVitae />
                                </TabPane>
                            </Tabs>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg mt-4  p-4 flex justify-end items-center gap-2 shadow-sm">
                    <BaseButton label={t('global.popup.reject')} disabled={false} />
                    <BaseButton label={t('global.popup.save')} type="primary" htmlType="submit" />
                </div>
            </Form>
        </div>
    );
};

export default Profile;
