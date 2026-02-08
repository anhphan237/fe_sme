import { APP_CONFIG, ENV_CONFIG } from '@/constants';
import { useLocale } from '@/i18n';
import { IdcardOutlined, InfoCircleOutlined, UserOutlined } from '@ant-design/icons';
import { Divider, Form, Tag, Upload, UploadFile, UploadProps } from 'antd';

import './index.less';

interface AvatarSectionProps {
    fileList: UploadFile[];
    setFileList: (fileList: UploadFile[]) => void;
    form: any;
}

const AvatarSection = ({ fileList, setFileList, form }: AvatarSectionProps) => {
    const { t } = useLocale();
    const fullName = Form.useWatch('fullName', { form, preserve: true });
    const employeeCode = Form.useWatch('employeeCode', { form, preserve: true });
    const status = Form.useWatch('status', { form, preserve: true });

    const getHeaderUploadImages = () => {
        const token = localStorage.getItem(APP_CONFIG.ACCESS_TOKEN);
        return {
            Authorization: `Bearer ${token?.trim()}`,
        };
    };

    const handleUploadChange: UploadProps['onChange'] = info => {
        if (info?.file?.status === 'done') {
            const response = info?.file?.response;
            form.setFieldValue('avatar', response?.data?.filePath);
        }
        if (info?.fileList?.length === 0) form.setFieldValue('avatar', '');
        setFileList(info?.fileList);
    };

    const renderStatus = (status?: number) => {
        if (status === undefined) return <Tag color="default">{t('employee.status.new')}</Tag>;

        const statusMap: Record<number, { label: string; color: string }> = {
            0: { label: t('employee.status.probation'), color: 'orange' },
            1: { label: t('employee.status.official'), color: 'green' },
            2: { label: t('employee.status.resigned'), color: 'red' },
            3: { label: t('employee.status.retired'), color: 'gray' },
            4: { label: t('employee.status.terminated'), color: 'red' },
            5: { label: t('employee.status.maternity_leave'), color: 'purple' },
        };
        const config = statusMap[status] || { label: t('employee.status.other'), color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
    };

    return (
        <div className="w-full flex flex-col items-center gap-4">
            <Form.Item name="avatar" className="mb-0 mt-4">
                <Upload
                    headers={getHeaderUploadImages()}
                    listType="picture-card"
                    prefixCls="employee-image"
                    action={`${ENV_CONFIG.API}/${ENV_CONFIG.API_VERSION}/File/Employees?override=true`}
                    accept="image/*"
                    fileList={fileList}
                    onChange={handleUploadChange}
                    showUploadList={{
                        showPreviewIcon: false,
                    }}
                >
                    {fileList.length > 0 ? null : (
                        <div className="flex flex-col items-center">
                            <UserOutlined className="text-4xl text-gray-400 mb-2" />
                            <div className="text-sm text-gray-500">{t('employee.upload_avatar')}</div>
                        </div>
                    )}
                </Upload>
            </Form.Item>

            <div className="w-full  rounded-lg p-4 space-y-3">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-800 truncate">{fullName || t('employee.new_employee')}</h3>
                </div>

                {employeeCode && (
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                        <IdcardOutlined />
                        <span className="font-mono">{employeeCode}</span>
                    </div>
                )}

                <div className="flex justify-center">{renderStatus(status)}</div>

                <Divider className="my-2" />
            </div>

            {fileList.length === 0 && (
                <div className="text-xs text-gray-500 text-center px-4">
                    <InfoCircleOutlined className="mr-1" />
                    {t('employee.avatar_hint')}
                </div>
            )}
        </div>
    );
};

export default AvatarSection;
