import { RegexValidate } from '@/constants';
import BaseInput from '@/core/components/Input/InputWithLabel';
import { useLocale } from '@/i18n';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Row } from 'antd';

import BaseButton from '@/components/button';

const EmergencyContacts = () => {
    const { t } = useLocale();

    return (
        <div className="overflow-auto h-[calc(100vh-280px)] pr-4">
            <Form.List name="emergencyContacts">
                {(fields, { add, remove }) => (
                    <>
                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} className="mb-4">
                            {t('employee.add_emergency_contact')}
                        </Button>
                        {fields.map((field, index) => (
                            <Card
                                key={field.key}
                                size="small"
                                title={`${t('employee.tab.emergency_contacts')} #${index + 1}`}
                                extra={<BaseButton danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />}
                                className="mb-4"
                            >
                                <Row gutter={[16, 16]}>
                                    <Col span={5}>
                                        <BaseInput
                                            name={[field.name, 'fullName']}
                                            label={t('employee.full_name')}
                                            placeholder={t('employee.full_name')}
                                            formItemProps={{
                                                rules: [{ required: true, message: t('global.message.required_field') }],
                                            }}
                                        />
                                    </Col>
                                    <Col span={3}>
                                        <BaseInput
                                            name={[field.name, 'relationship']}
                                            label={t('employee.relationship')}
                                            placeholder={t('employee.relationship')}
                                            formItemProps={{
                                                rules: [{ required: true, message: t('global.message.required_field') }],
                                            }}
                                        />
                                    </Col>
                                    <Col span={3}>
                                        <BaseInput
                                            name={[field.name, 'phone']}
                                            label={t('employee.mobile_phone')}
                                            placeholder={t('employee.mobile_phone')}
                                            formItemProps={{
                                                rules: [
                                                    { required: true, message: t('global.message.required_field') },
                                                    { pattern: RegexValidate.PHONE, message: t('global.message.invalid_phone') },
                                                ],
                                            }}
                                        />
                                    </Col>
                                    <Col span={5}>
                                        <BaseInput
                                            name={[field.name, 'email']}
                                            label={t('employee.personal_email')}
                                            placeholder={t('employee.personal_email')}
                                            formItemProps={{
                                                rules: [{ type: 'email', message: t('global.message.invalid_email') }],
                                            }}
                                        />
                                    </Col>
                                    <Col span={8}>
                                        <BaseInput name={[field.name, 'address']} label={t('employee.address')} placeholder={t('employee.address')} />
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

export default EmergencyContacts;
