import { useLocale } from '@/i18n';
import { CheckCircleOutlined, CloseCircleOutlined, FileTextOutlined, SendOutlined } from '@ant-design/icons';
import { Steps } from 'antd';
import React from 'react';

interface TrackingStatusProps {
    currentStep: number; // 0: Draft, 1: Waiting, 2: Approved, 3: Rejected
    creator?: string;
    createdAt?: string;
    note?: string;
}

const TrackingStatus: React.FC<TrackingStatusProps> = ({ currentStep, creator = 'ABC', createdAt = '01-08-2025', note = '' }) => {
    const { t } = useLocale();

    const steps = [
        {
            title: t('contract.status.draft'),
            description: (
                <div className="text-gray-600 text-sm mt-1">
                    <p>
                        {t('contract.status.createdBy')}: <span className="font-medium">{creator}</span>
                    </p>
                    <p>
                        {t('contract.status.createdAt')} <span className="font-medium">{createdAt}</span>
                    </p>
                </div>
            ),
            icon: <FileTextOutlined />,
        },
        {
            title: t('contract.status.waitingApproval'),
            description: (
                <div className="text-gray-600 text-sm mt-1">
                    <p>{t('contract.status.pendingApproval')}</p>
                    <p>
                        {t('contract.status.content')}: {note || <span className="italic text-gray-400">{t('contract.status.empty')}</span>}
                    </p>
                </div>
            ),
            icon: <SendOutlined />,
        },
        {
            title: t('contract.status.approved'),
            description: (
                <div className="text-gray-600 text-sm mt-1">
                    <p>{t('contract.status.approvedDesc')}</p>
                </div>
            ),
            icon: <CheckCircleOutlined />,
        },
        {
            title: t('contract.status.rejected'),
            description: (
                <div className="text-gray-600 text-sm mt-1">
                    <p>{t('contract.status.rejectedDesc')}</p>
                    <p>
                        {t('contract.status.reason')}: {note || <span className="italic text-gray-400">{t('contract.status.empty')}</span>}
                    </p>
                </div>
            ),
            icon: <CloseCircleOutlined />,
        },
    ];

    return (
        <div className="bg-gray-50 p-6 rounded-2xl">
            <h2 className="text-lg font-semibold mb-4">{t('contract.status.detailTitle')}</h2>
            <Steps
                direction="vertical"
                current={currentStep}
                items={steps.map((step, index) => ({
                    title: <span className="font-medium">{step.title}</span>,
                    description: step.description,
                    icon: step.icon,
                    status: currentStep === index ? 'process' : currentStep > index ? 'finish' : 'wait',
                }))}
            />
        </div>
    );
};

export default TrackingStatus;
