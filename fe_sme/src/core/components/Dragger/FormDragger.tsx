import { useLocale } from '@/i18n';
import { InboxOutlined } from '@ant-design/icons';
import { FormItemProps, Upload, UploadProps, message } from 'antd';
import { NamePath } from 'antd/es/form/interface';
import Dragger from 'antd/es/upload/Dragger';

import BaseFormItem from '../Form/BaseFormItem';

export interface FormDraggerProps<T> extends UploadProps<T> {
    name: NamePath;
    formItemProps?: FormItemProps;
}
const FormDragger = <T= any,>({ name, formItemProps, ...props }: FormDraggerProps<T>) => {
    const { t } = useLocale();

    const defaultUploadProps: UploadProps = {
        name: 'file',
        multiple: false,
        showUploadList: false,
        accept: '.xlsx,.xls,.png,.jpg,.jpeg,.pdf,.docx',
        beforeUpload: file => {
            const isAcceptedType = [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel',
                'image/png', 
                'image/jpeg',
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ].includes(file.type);
            if (!isAcceptedType) {
                message.error(t('import.message.invalid_file_type'));
            }
            return isAcceptedType || Upload.LIST_IGNORE;
        },
    };

    return (
        <BaseFormItem name={name} {...formItemProps}>
            <Dragger {...defaultUploadProps} {...props}>
                <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                </p>
                <p className="ant-upload-text">{t('import.drag_and_drop')}</p>
                <p className="ant-upload-hint">{t('import.hint')}</p>
            </Dragger>
        </BaseFormItem>
    );
};

export default FormDragger;
