import BaseDatePicker from '@/core/components/DatePicker';
import BaseInputNumber from '@/core/components/Input/BaseNumberInput';
import BaseInput from '@/core/components/Input/InputWithLabel';
import { useLocale } from '@/i18n';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Row } from 'antd';

import BaseButton from '@/components/button';

import { convertedDateProps } from '@/utils/helpers';

import { RegexValidate } from '@/constants/global';

const IdentityDocuments = () => {
    const { t } = useLocale();

    return (
        <div className="overflow-auto h-[calc(100vh-280px)] pr-4">
            <Form.List name="identityDocuments">
                {(fields, { add, remove }) => (
                    <>
                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} className="mb-4">
                            {t('employee.add_document')}
                        </Button>
                        {fields.map((field, index) => (
                            <Card
                                key={field.key}
                                size="small"
                                title={`${t('employee.tab.identity_documents')} #${index + 1}`}
                                extra={<BaseButton danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />}
                                className="mb-4"
                            >
                                <Row gutter={[16, 16]}>
                                    <Col span={4}>
                                        <BaseInput
                                            name={[field.name, 'documentType']}
                                            label={t('employee.document_type')}
                                            placeholder={t('employee.document_type')}
                                            formItemProps={{
                                                rules: [{ required: true, message: t('global.message.required_field') }],
                                            }}
                                        />
                                    </Col>
                                    <Col span={4}>
                                        <BaseInputNumber
                                            name={[field.name, 'documentNumber']}
                                            label={t('employee.document_number')}
                                            placeholder={t('employee.document_number')}
                                            formItemProps={{
                                                rules: [
                                                    { required: true, message: t('global.message.required_field') },
                                                    { pattern: RegexValidate.CCCD, message: t('global.message.CCCD') },
                                                ],
                                            }}
                                        />
                                    </Col>
                                    <Col span={4}>
                                        <BaseDatePicker
                                            name={[field.name, 'issueDate']}
                                            label={t('employee.issue_date')}
                                            placeholder={t('employee.issue_date')}
                                            format="DD-MM-YYYY"
                                            className="w-full"
                                            formItemProps={convertedDateProps}
                                        />
                                    </Col>
                                    <Col span={4}>
                                        <BaseDatePicker
                                            name={[field.name, 'expiryDate']}
                                            label={t('employee.expiry_date')}
                                            placeholder={t('employee.expiry_date')}
                                            format="DD-MM-YYYY"
                                            className="w-full"
                                            formItemProps={convertedDateProps}
                                        />
                                    </Col>
                                    <Col span={8}>
                                        <BaseInput
                                            name={[field.name, 'issuePlace']}
                                            label={t('employee.issued_by')}
                                            placeholder={t('employee.issued_by')}
                                        />
                                    </Col>
                                </Row>
                            </Card>
                        ))}
                    </>
                )}
            </Form.List>
        </div>
    );
};

export default IdentityDocuments;
