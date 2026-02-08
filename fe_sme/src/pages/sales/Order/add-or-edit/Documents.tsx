import { apiGetFileFromPath, apiUploadFile } from '@/api/file.api';
import { useLocale } from '@/i18n';
import FormDragger, { FormDraggerProps } from '@core/components/Dragger/FormDragger';
import { faFileExcel, faFilePdf, faFileWord, faImage, faPaperclip } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Drawer, Form, Spin } from 'antd';
import React, { forwardRef, useImperativeHandle } from 'react';
import { useParams } from 'react-router-dom';

import { notify } from '@/components/toast-message';

import usePromiseHolder from '@/hooks/usePromiseHolder';

import { FileHelper } from '@/utils/helpers';

import { QuotationAttachment } from '@/interface/sales';

import DrawerFooter from '../../components/DrawerFooter';

interface Results {
    code: number;
    data?: QuotationAttachment[];
    message?: string;
}

interface DocumentProps {
    attachmentPath: string;
    disabled?: boolean;
}

export interface AttachmentRef {
    open: (data: QuotationAttachment[]) => Promise<Results>;
}

const acceptedExtensions = ['.xlsx', '.xls', '.png', '.jpg', '.jpeg', '.pdf', '.docx'];
const acceptedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'image/png',
    'image/jpeg',
    'image/jpg',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];
const maxSize = 10 * 1024 * 1024;

const Documents = ({ attachmentPath, disabled }: DocumentProps, ref: React.Ref<AttachmentRef>) => {
    const { t } = useLocale();
    const [loading, setLoading] = React.useState(false);
    const [open, setOpen] = React.useState(false);
    const { execute, resolve, reject } = usePromiseHolder<Results>({});
    const { id: detailId } = useParams<{ id?: string }>();
    const [form] = Form.useForm<{ attachments: QuotationAttachment[] }>();
    const attachments = Form.useWatch<QuotationAttachment[]>('attachments', { form, preserve: true }) || [];

    const cleanup = () => {
        setOpen(false);
        form.setFieldsValue({ attachments: [] });
    };

    const handleClose = () => {
        cleanup();
        reject({ code: -1, message: t('global.cancel') });
    };

    const handleOpen = async (data: QuotationAttachment[]) => {
        setOpen(true);
        form.setFieldsValue({ attachments: data || [] });
        return execute();
    };

    const handleSubmit = async () => {
        const formValues = form.getFieldsValue(true);
        cleanup();
        resolve({ code: 200, data: formValues.attachments });
    };

    const handleUploadFinish = () => {};

    useImperativeHandle(ref, () => ({
        open: handleOpen,
    }));

    const customRequest = async (options: any) => {
        const { file, onSuccess, onError } = options;
        try {
            setLoading(true);
            // Additional validation in customRequest
            const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
            if (!acceptedExtensions.includes(fileExtension)) {
                throw new Error(
                    t('global.message.error.invalid_file_type', {
                        types: acceptedExtensions.join(', '),
                    }),
                );
            }
            const formData = new FormData();
            formData.append('file', file);
            const response = await apiUploadFile(formData, attachmentPath, { override: true });
            if (!response || !response.succeeded || !response.data.filePath) throw new Error(t('global.message.error'));
            onSuccess?.(response);
            const updatedAttachments = form.getFieldValue('attachments') || [];
            const matched = updatedAttachments.find((a: any) => a.uid === file.uid);
            if (matched) {
                matched.path = response.data.filePath;
                matched.status = 'done';
                matched.id = file.uid;
                matched.extension = file.name.split('.').pop() || '';
                matched.name = file.name;
                matched.description = file.type;
            } else {
                updatedAttachments.push({
                    id: file.uid,
                    quotationIssueId: detailId,
                    name: file.name,
                    description: file.type,
                    extension: file.name.split('.').pop() || '',
                    path: response.data.filePath,
                    status: 'done',
                });
            }
            notify.success('global.message.success');
            form.setFieldValue('attachments', updatedAttachments);
        } catch (error) {
            onError?.(error);
            notify.error(t('global.message.error'));
        } finally {
            setLoading(false);
        }
    };

    const customIconRender: FormDraggerProps<QuotationAttachment>['iconRender'] = file => {
        const extension = file.response?.extension?.toLowerCase() ?? (file as any).extension?.toLowerCase();
        const isLoading = file.status === 'uploading';
        if (isLoading) return <Spin size="small" className="text-primary" spinning />;
        if (['png', 'jpg', 'jpeg'].includes(extension)) {
            return <FontAwesomeIcon icon={faImage} />;
        }
        if (['pdf'].includes(extension)) {
            return <FontAwesomeIcon icon={faFilePdf} />;
        }
        if (['docx'].includes(extension)) {
            return <FontAwesomeIcon icon={faFileWord} />;
        }
        if (['xlsx', 'xls'].includes(extension)) {
            return <FontAwesomeIcon icon={faFileExcel} />;
        }
        return <FontAwesomeIcon icon={faPaperclip} />;
    };

    const handlePreview = async (file: any) => {
        try {
            const filePath = (file?.url ?? file?.path) as string;
            const dataBlob = await apiGetFileFromPath(filePath);
            await FileHelper.downloadFromBlob(dataBlob as any, file.name);
            notify.success(t('global.message.export_success'));
        } catch (error) {
            notify.error('global.message.export_failed');
        }
    };

    const handleRemove = async (file: any) => {
        const updatedAttachments = form.getFieldValue('attachments') || [];
        const index = updatedAttachments.findIndex((a: any) => a.uid === file.uid || a.id === file.uid);
        if (index !== -1) {
            const newAttachments = [...updatedAttachments];
            newAttachments.splice(index, 1);
            form.setFieldValue('attachments', updatedAttachments);
        } else {
            notify.error(t('global.message.error_occurs'));
            return false;
        }
        return true;
    };

    const beforeUpload = (file: File) => {
        // Check file extension
        const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
        const isValidExtension = acceptedExtensions.includes(fileExtension);

        // Check MIME type
        const isValidMimeType = acceptedMimeTypes.includes(file.type);
        if (!isValidExtension || !isValidMimeType) {
            notify.error(
                t('global.message.error.invalid_file_type', {
                    types: acceptedExtensions.join(', '),
                }),
            );
            return false;
        }

        if (file.size > maxSize) {
            notify.error(t('global.message.error.file_too_large', { size: '10MB' }));
            return false;
        }

        return true;
    };

    const handleDrop: FormDraggerProps<QuotationAttachment>['onDrop'] = e => {
        const files = Array.from(e.dataTransfer.files);
        const invalidFiles = files.filter(file => {
            const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
            const isValidExtension = acceptedExtensions.includes(fileExtension);
            const isValidMimeType = acceptedMimeTypes.includes(file.type);
            const isValidSize = file.size <= maxSize;
            return !isValidExtension || !isValidMimeType || !isValidSize;
        });
        if (invalidFiles.length > 0) {
            for (const file of invalidFiles) {
                const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
                if (!acceptedExtensions.includes(fileExtension) || !acceptedMimeTypes.includes(file.type)) {
                    notify.error(
                        t('global.message.error.invalid_file_type', {
                            types: acceptedExtensions.join(', '),
                        }),
                    );
                    break;
                } else if (file.size > maxSize) {
                    notify.error(t('global.message.error.file_too_large', { size: '10MB' }));
                    break;
                }
            }
        }
    };

    const handleNormalize = (val: any) => {
        if (!val || !val.fileList) return [];

        // Filter out invalid files that failed beforeUpload
        const validFiles = val.fileList.filter((file: any) => {
            // Re-validate each file
            if (file.originFileObj) {
                const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
                const isValidExtension = acceptedExtensions.includes(fileExtension);
                const isValidMimeType = acceptedMimeTypes.includes(file.originFileObj.type);
                const isValidSize = file.originFileObj.size <= maxSize;

                return isValidExtension && isValidMimeType && isValidSize;
            }
            return true; // Keep existing valid files
        });

        return validFiles.map((file: any) => ({
            ...file,
            uid: file.uid || file.id,
        }));
    };

    return (
        <Drawer
            title={t('global.file')}
            placement="right"
            open={open}
            onClose={handleClose}
            closable={false}
            maskClosable={false}
            width={550}
            styles={{
                body: { padding: 8 },
            }}
            style={{ zIndex: 1200 }}
            footer={
                <DrawerFooter
                    cancelBtnProps={{ disabled: false }}
                    applyBtnProps={{ label: t('global.save'), disabled: disabled }}
                    onCancel={handleClose}
                    onOk={handleSubmit}
                />
            }
        >
            <Form
                name="form-sale-attachment"
                layout="vertical"
                rootClassName="relative"
                className="w-full h-[calc(100vh_-_94px)] flex flex-col bg-white rounded-lg overflow-auto"
                onFinish={handleUploadFinish}
                autoComplete="off"
                form={form}
                preserve
                disabled={disabled}
            >
                <FormDragger
                    name={'attachments'}
                    beforeUpload={beforeUpload}
                    customRequest={customRequest}
                    listType="text"
                    showUploadList
                    formItemProps={{
                        normalize: handleNormalize,
                    }}
                    fileList={attachments.map(attachment => ({
                        ...attachment,
                        uid: attachment.id,
                        name: attachment.name,
                        status: attachment?.status ?? 'done',
                        url: attachment.path,
                        extension: attachment.extension,
                    }))}
                    onPreview={handlePreview}
                    onDrop={handleDrop}
                    onRemove={handleRemove}
                    disabled={loading || disabled}
                    accept={acceptedExtensions.join(',')}
                    iconRender={customIconRender}
                />
            </Form>
        </Drawer>
    );
};

export default forwardRef(Documents);
