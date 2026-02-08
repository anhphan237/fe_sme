import { apiExport } from '@/api/file.api';
import { useLocale } from '@/i18n';
// import { useAppSelector } from '@/stores';
import { Checkbox, Col, Form, Row } from 'antd';
import { DefaultOptionType } from 'antd/es/select';
import moment from 'moment';
import React, { forwardRef, useImperativeHandle, useState } from 'react';

import BaseButton from '@/components/button';

import usePromiseHolder from '@/hooks/usePromiseHolder';

import { convertedDateProps, handleCommonError } from '@/utils/helpers';

import BaseDatePicker from '../DatePicker';
import BaseModal from '../Modal/BaseModal';
import BaseSelect from '../Select/BaseSelect';
import InfiniteScrollSelect from '../Select/InfinitieScroll';

export interface AdditionalFilterConfig {
    name: string;
    label: string;
    type: 'select' | 'multi-select' | 'infinite-select';
    options?: DefaultOptionType[];
    fetchData?: (params: { pageNumber: number; pageSize: number; search?: string }) => Promise<any>;
    mapData?: (data: any[]) => any[];
    placeholder?: string;
    span?: number;
    mode?: 'multiple' | 'tags';
    showSearch?: boolean;
    allowClear?: boolean;
    queryKey?: string[];
}

interface ExportModalProps {
    title?: string;
    urlPath?: string;
    submitLabel?: string;
    additionalParams?: Record<string, any>;
    showDateFilter?: boolean;
    showStatusFilter?: boolean;
    showCheckboxFilter?: boolean;
    checkboxLabel?: string;
    defaultChecked?: boolean;
    additionalFilters?: AdditionalFilterConfig[];
}

export interface ExportModalRef {
    open: (val: DefaultOptionType[]) => Promise<any>;
}

const ExportModal = (
    {
        title = 'Xuất dữ liệu',
        urlPath = 'Products',
        submitLabel = 'Gửi',
        additionalParams = {},
        showDateFilter = true,
        showStatusFilter = true,
        showCheckboxFilter = false,
        checkboxLabel = '',
        defaultChecked = true,
        additionalFilters,
    }: ExportModalProps,
    ref: React.Ref<ExportModalRef>,
) => {
    const [visible, setVisible] = useState<DefaultOptionType[] | null>(null);
    const [uploading, setUploading] = useState(false);
    const [isChecked, setIsChecked] = useState(defaultChecked);
    // const { exportWorker } = useAppSelector(state => state.worker);
    const { execute, resolve, reject } = usePromiseHolder({});
    const [form] = Form.useForm();
    const startTime = Form.useWatch(['range', 'from'], { form });
    const endTime = Form.useWatch(['range', 'to'], { form });
    const { t } = useLocale();

    const handleOpenModal = async (listOption: DefaultOptionType[]) => {
        setVisible(listOption);
        return execute();
    };

    useImperativeHandle(ref, () => ({
        open: handleOpenModal,
    }));

    const onClose = () => {
        setVisible(null);
        reject({ code: -1, message: 'User cancel' });
        form.resetFields();
        setIsChecked(defaultChecked);
    };

    const handleSubmit = async (values: any) => {
        setUploading(true);
        try {
            const payload = {
                ...additionalParams,
                ...values,
                ...(showCheckboxFilter && { isChecked }),
                ...(showDateFilter && {
                    range: {
                        from: values.range?.from,
                        to: values.range?.to ? moment(values.range.to).endOf('day') : null,
                    },
                }),
            };
            const response = await apiExport({ path: urlPath, ...payload });

            if (!response.succeeded) {
                throw response;
            }
            resolve(response);
            setVisible(null);
            form.resetFields();
            setIsChecked(defaultChecked);
        } catch (error: any) {
            handleCommonError(error, t);
        } finally {
            setUploading(false);
        }
    };

    return (
        <BaseModal title={title} open={!!visible} onCancel={onClose} footer={null} destroyOnClose centered>
            <Form form={form} layout="vertical" onFinish={handleSubmit} disabled={uploading}>
                <Row gutter={[8, 16]}>
                    {showDateFilter && (
                        <>
                            <Col span={12}>
                                <BaseDatePicker
                                    name={['range', 'from']}
                                    label={t('global.from_date')}
                                    placeholder={t('global.from_date')}
                                    className="w-full"
                                    formItemProps={{
                                        ...convertedDateProps,
                                        wrapperCol: { span: 24 },
                                        rules: [{ required: true, message: t('global.message.required_field') }],
                                    }}
                                    maxDate={(endTime ? moment(endTime) : undefined) as any}
                                />
                            </Col>
                            <Col span={12}>
                                <BaseDatePicker
                                    name={['range', 'to']}
                                    label={t('global.to_date')}
                                    placeholder={t('global.to_date')}
                                    className="w-full"
                                    formItemProps={{
                                        ...convertedDateProps,
                                        rules: [{ required: true, message: t('global.message.required_field') }],
                                    }}
                                    minDate={(startTime ? moment(startTime) : undefined) as any}
                                />
                            </Col>
                        </>
                    )}
                    {/* Hiện Status NẾU showStatusFilter = true */}
                    {showStatusFilter && (
                        <Col span={12}>
                            <BaseSelect
                                options={visible || []}
                                placeholder={t('global.status')}
                                label={t('global.status')}
                                className="w-full"
                                name="status"
                            />
                        </Col>
                    )}

                    {additionalFilters?.map((filterConfig, index) => (
                        <Col span={12} key={`filter-${index}`}>
                            {filterConfig.type === 'infinite-select' ? (
                                <InfiniteScrollSelect
                                    name={filterConfig.name}
                                    label={filterConfig.label}
                                    placeholder={filterConfig.placeholder || filterConfig.label}
                                    mode={filterConfig.mode || 'multiple'}
                                    showSearch={filterConfig.showSearch !== false}
                                    allowClear={filterConfig.allowClear !== false}
                                    fetchData={filterConfig.fetchData!}
                                    mapData={filterConfig.mapData}
                                    queryKey={filterConfig.queryKey || [`export-${filterConfig.name}`]}
                                    formItemProps={{ className: '!mb-0' }}
                                    maxTagCount="responsive"
                                />
                            ) : (
                                <BaseSelect
                                    name={filterConfig.name}
                                    label={filterConfig.label}
                                    placeholder={filterConfig.placeholder || filterConfig.label}
                                    options={filterConfig.options || []}
                                    mode={filterConfig.type === 'multi-select' ? 'multiple' : undefined}
                                    showSearch={filterConfig.showSearch}
                                    allowClear={filterConfig.allowClear}
                                />
                            )}
                        </Col>
                    ))}

                    {/* Hiện Checkbox NẾU showCheckboxFilter = true */}
                    {showCheckboxFilter && (
                        <Col span={24}>
                            <Checkbox checked={isChecked} onChange={e => setIsChecked(e.target.checked)}>
                                <strong>{checkboxLabel}</strong>
                            </Checkbox>
                        </Col>
                    )}
                    {/* <Col span={24}>{t('export.note')}</Col> */}
                    <Col span={24} className="mt-4">
                        <BaseButton type="primary" htmlType="submit" className="w-full" loading={uploading} label={submitLabel} />
                    </Col>
                </Row>
            </Form>
        </BaseModal>
    );
};

export default forwardRef(ExportModal);
