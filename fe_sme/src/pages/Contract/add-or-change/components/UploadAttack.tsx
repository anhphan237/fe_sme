import FormDragger from '@/core/components/Dragger/FormDragger';
import { useLocale } from '@/i18n';
import { DownloadOutlined, InboxOutlined, UploadOutlined } from '@ant-design/icons';
import { faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Drawer, Upload, message } from 'antd';
import React, { useState } from 'react';

import BaseFloatButton from '@/components/button/BaseFloatButton';

import RightControl from './RightControl';

const { Dragger } = Upload;

const UploadAttack: React.FC = () => {
    const [open, setOpen] = useState(false);
    const { t } = useLocale();
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const uploadProps = {
        name: 'file',
        multiple: true,
        action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76', // fake upload endpoint
        onChange(info: any) {
            const { status } = info.file;
            if (status === 'done') {
                message.success(`${info.file.name} đã tải lên thành công.`);
            } else if (status === 'error') {
                message.error(`${info.file.name} tải lên thất bại.`);
            }
        },
    };

    return (
        <div>
            <RightControl>
                <BaseFloatButton
                    icon={<FontAwesomeIcon icon={faFileExcel} size="lg" />}
                    badge={{ count: 1 }}
                    type="primary"
                    onClick={handleOpen}
                    title={t('global.file')}
                />
            </RightControl>

            <Drawer
                title={<div className="flex items-center gap-2 text-colorPrimary font-semibold">Tải lên tài liệu hợp đồng</div>}
                placement="right"
                onClose={handleClose}
                open={open}
                width={420}
                className="[&_.ant-drawer-body]:bg-gray-50"
            >
                <p className="text-gray-600 mb-3">
                    Chọn hoặc kéo thả file vào vùng bên dưới để tải lên. Hỗ trợ nhiều định dạng như PDF, DOCX, XLSX, ZIP.
                </p>
                <FormDragger name="attachmentFile" formItemProps={{ label: t('contract.add.attachment') }} />
            </Drawer>
        </div>
    );
};

export default UploadAttack;
