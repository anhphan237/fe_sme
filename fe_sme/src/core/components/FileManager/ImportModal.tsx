import { apiGetFileTemplateByType } from '@/api/file.api';
import { APP_CONFIG, ENV_CONFIG } from '@/constants';
import { useLocale } from '@/i18n';
import { useAppSelector } from '@/stores';
import { InboxOutlined } from '@ant-design/icons';
import { faClose, faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Col, Form, Progress, Row, Typography, Upload, message } from 'antd';
import type { UploadFile, UploadProps } from 'antd/es/upload';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

import BaseButton from '@/components/button';

import usePromiseHolder from '@/hooks/usePromiseHolder';

import { FileHelper } from '@/utils/helpers';

import BaseFormItem from '../Form/BaseFormItem';
import BaseModal from '../Modal/BaseModal';

const { Dragger } = Upload;
const { Text } = Typography;

interface ImportModalProps {
    onUploadSuccess?: (file: UploadFile) => void;
    fullUrl?: string;
    title?: string;
    mode?: 'product' | 'productGroup' | 'productType'; // Thêm mode
    templateType?: 'Products' | 'ProductGroup' | 'ProductType'; // Thêm template type
}

export interface ImportModalRef {
    open: () => Promise<any>;
}

const ImportModal = (
    {
        onUploadSuccess,
        title,
        // fullUrl = `${ENV_CONFIG.API}/${ENV_CONFIG.API_VERSION}/File/Products?override=true`,
        fullUrl,
        mode,
        templateType = 'Products',
    }: ImportModalProps,
    ref: React.Ref<ImportModalRef>,
) => {
    const [visible, setVisible] = useState(false);
    const [uploading, setUploading] = useState(false);
    const { importWorker } = useAppSelector(state => state.worker);
    const { execute, resolve, reject } = usePromiseHolder({});
    const onSuccessRef = useRef<any>(null);
    const onErrorRef = useRef<any>(null);
    const fileRef = useRef<UploadFile | null>(null);
    const [listFile, setListFile] = useState<UploadFile[]>([]);
    const [form] = Form.useForm();

    // custom fields values
    // const productUnit = Form.useWatch('productUnit', form);
    const supplierValue = Form.useWatch('supplier', form);
    const productTypeValue = Form.useWatch('productType', form);
    const productGroupValue = Form.useWatch('productGroup', form);

    const { t } = useLocale();
    console.log('ImportModal mode:', mode);

    const handleOpenModal = async () => {
        setVisible(true);
        return execute();
    };

    useImperativeHandle(ref, () => ({
        open: handleOpenModal,
    }));

    useEffect(() => {
        if (!importWorker) {
            message.error('Upload worker not available');
            return;
        }
        importWorker.onmessage = e => {
            const { type, percent, message: workerMessage, originFile } = e.data;

            if (originFile) {
                setListFile(prev => {
                    const newList = [...prev];
                    const uuid = originFile.lastModified;
                    if (!uuid) return newList;
                    const existedFile = newList.find(file => file.uid === uuid);
                    let status: UploadFile['status'] | undefined;
                    let currentPercent = percent;
                    if (type === 'progress') {
                        status = 'uploading';
                    } else if (type === 'success') {
                        status = 'done';
                        currentPercent = 100;
                    } else if (type === 'error') {
                        status = 'error';
                        currentPercent = 100;
                    }
                    if (existedFile) {
                        existedFile.percent = currentPercent;
                        existedFile.status = status;
                        existedFile.name = originFile.name;
                    } else {
                        newList.push({
                            ...originFile,
                            percent: currentPercent,
                            status: status,
                            name: originFile.name,
                            uid: originFile.lastModified,
                        });
                    }
                    return newList;
                });
            }
            if (type === 'progress') {
                setUploading(true);
            } else if (type === 'cancel') {
                setUploading(false);
                reject({ code: -1, message: workerMessage });
            } else if (type === 'success') {
                onSuccessRef.current?.(workerMessage);
                message.success(workerMessage);
                if (onUploadSuccess && fileRef.current) onUploadSuccess(fileRef.current);
                setUploading(false);
                resolve(workerMessage);
            } else if (type === 'error') {
                onSuccessRef.current?.(t('global.message.error_occurs'));
                message.error(t('global.message.error_occurs'));
                setUploading(false);
                reject({ code: -1, message: t('global.message.error_occurs') });
            }
        };
    }, []);

    const getDisableCondition = () => {
        switch (mode) {
            case 'product':
                return uploading || !productTypeValue || !supplierValue;
            case 'productGroup':
                return uploading;
            case 'productType':
                return uploading || !productGroupValue;
            default:
                return uploading;
        }
    };

    const getUploadParams = () => {
        switch (mode) {
            case 'product':
                return {
                    productTypeId: productTypeValue,
                    supplierId: supplierValue,
                };
            case 'productGroup':
                return { type: 0 };
            case 'productType':
                return { type: 1, productGroupId: productGroupValue };
            default:
                return {
                    productTypeId: productTypeValue,
                    supplierId: supplierValue,
                };
        }
    };

    const customRequest = async (options: any) => {
        const { file, onSuccess, onError } = options;
        onSuccessRef.current = onSuccess;
        onErrorRef.current = onError;
        fileRef.current = file;

        setUploading(true);
        if (!importWorker) {
            message.error(t('global.message.error_occurs'));
            return;
        }

        const uploadParams = getUploadParams();

        importWorker.postMessage({
            file,
            uploadUrl: fullUrl,
            token: localStorage.getItem(APP_CONFIG.ACCESS_TOKEN),
            mode,
            ...uploadParams,
        });
    };

    const onClose = () => {
        setVisible(false);
        setListFile([]);
        form.resetFields();
        reject({ code: -1, message: 'User cancel' });
    };

    const handleDownloadTemplate = async () => {
        try {
            const { data: response, fileName } = await apiGetFileTemplateByType(templateType);
            FileHelper.downloadFromBlob(response, fileName);
        } catch (error) {
            message.error(t('global.download_failed'));
        }
    };

    const uploadProps: UploadProps = {
        name: 'file',
        multiple: false,
        customRequest,
        showUploadList: false,
        accept: '.xlsx,.xls',
        beforeUpload: file => {
            const isExcel =
                file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel';
            if (!isExcel) {
                message.error(t('import.message.excel_only'));
            }
            return isExcel || Upload.LIST_IGNORE;
        },
        onDrop: e => {
            const file = e.dataTransfer.files?.[0];
            if (!file) return;

            const isExcel =
                file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel';

            if (!isExcel) {
                message.error(t('import.message.excel_only'));
            }
        },
    };

    const renderFile = (file: UploadFile, index: number) => {
        if (!file) return null;
        if (['uploading', 'done', 'error'].includes(file.status || '')) {
            const progressStatus = file.status === 'uploading' ? 'active' : file.status === 'done' ? 'success' : 'exception';
            return (
                <div key={file?.uid ?? index} className="flex items-start outline rounded outline-gray-200 box-border p-2 flex-col gap-2">
                    <span className="inline-flex justify-start items-center w-full">
                        <FontAwesomeIcon icon={faFileExcel} className="mr-2" />
                        <Text className="grow">{file.name}</Text>
                        <FontAwesomeIcon
                            icon={faClose}
                            className="ml-2 cursor-pointer"
                            onClick={() => {
                                setListFile(prev => [...prev.filter(item => item.uid !== file.uid)]);
                                importWorker?.postMessage({ type: 'cancel', file });
                            }}
                        />
                    </span>
                    <Progress percent={file.percent} status={progressStatus} />
                </div>
            );
        }
        return null;
    };

    const getTemplateBButtonLabel = () => {
        switch (mode) {
            case 'product':
                return t('product.template.download');
            case 'productGroup':
                return t('product_group.template.download');
            case 'productType':
                return t('product_type.template.download');
            default:
                return t('product.template.download');
        }
    };

    return (
        <BaseModal title={title} open={visible} onCancel={onClose} footer={null} destroyOnClose centered>
            <Form form={form} layout="vertical" className="w-full">
                <Row gutter={[8, 16]}>
                    <Col span={24}>
                        <BaseFormItem name="file">
                            <Dragger {...uploadProps} disabled={getDisableCondition()}>
                                <p className="ant-upload-drag-icon">
                                    <InboxOutlined />
                                </p>
                                <p className="ant-upload-text">{t('import.drag_and_drop')}</p>
                                <p className="ant-upload-hint">{t('import.hint')}</p>
                            </Dragger>
                        </BaseFormItem>
                    </Col>

                    <Col span={24} className="min-h-16">
                        {listFile.map(renderFile)}
                    </Col>

                    <Col span={24} className="text-right">
                        <BaseButton type="link" className="hover:underline" onClick={handleDownloadTemplate} label={getTemplateBButtonLabel()} />
                    </Col>
                </Row>
            </Form>
        </BaseModal>
    );
};

export default forwardRef(ImportModal);
