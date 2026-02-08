import BaseDatePicker from '@/core/components/DatePicker';
import BaseInputNumber from '@/core/components/Input/BaseNumberInput';
import BaseInput from '@/core/components/Input/InputWithLabel';
import BaseTextArea from '@/core/components/TextArea/BaseTextArea';
import { useLocale } from '@/i18n';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Row } from 'antd';

import BaseButton from '@/components/button';

import { convertedDateProps } from '@/utils/helpers';

const Contracts = () => {
    const { t } = useLocale();

    return (
        <div className="overflow-auto h-[calc(100vh-280px)] pr-4">
            <Form.List name="contracts">
                {(fields, { add, remove }) => (
                    <>
                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} className="mb-4">
                            {t('employee.add_contract')}
                        </Button>
                        {fields.map((field, index) => (
                            <Card
                                key={field.key}
                                size="small"
                                title={`${t('employee.tab.contracts')} #${index + 1}`}
                                extra={<BaseButton danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />}
                                className="mb-4"
                            >
                                <Row gutter={[16, 16]}>
                                    <Col span={4}>
                                        <BaseInput
                                            name={[field.name, 'contractType']}
                                            label={t('employee.contract_type')}
                                            placeholder={t('employee.contract_type')}
                                            formItemProps={{
                                                rules: [{ required: true, message: t('global.message.required_field') }],
                                            }}
                                        />
                                    </Col>
                                    <Col span={4}>
                                        <BaseInputNumber
                                            name={[field.name, 'salary']}
                                            label={t('employee.salary')}
                                            placeholder={t('employee.salary')}
                                            min={1}
                                            isMoneyFormat
                                            formItemProps={{
                                                rules: [
                                                    { required: true, message: t('global.message.required_field') },
                                                    { type: 'number', min: 1, message: t('global.message.invalid_format') },
                                                ],
                                            }}
                                        />
                                    </Col>
                                    {/* <Col span={12}>
                                        <BaseInput
                                            name={[field.name, 'contractNumber']}
                                            label={t('employee.contract_number')}
                                            placeholder={t('employee.contract_number')}
                                        />
                                    </Col> */}
                                    <Col span={4}>
                                        <BaseDatePicker
                                            name={[field.name, 'startDate']}
                                            label={t('employee.start_date')}
                                            placeholder={t('employee.start_date')}
                                            format="DD-MM-YYYY"
                                            className="w-full"
                                            formItemProps={{
                                                ...convertedDateProps,
                                                rules: [{ required: true, message: t('global.message.required_field') }],
                                            }}
                                        />
                                    </Col>
                                    <Col span={4}>
                                        <BaseDatePicker
                                            name={[field.name, 'endDate']}
                                            label={t('employee.end_date')}
                                            placeholder={t('employee.end_date')}
                                            format="DD-MM-YYYY"
                                            className="w-full"
                                            formItemProps={convertedDateProps}
                                        />
                                    </Col>

                                    {/* <Col span={12}>
                                        <BaseInput
                                            name={[field.name, 'position']}
                                            label={t('employee.position')}
                                            placeholder={t('employee.position')}
                                        />
                                    </Col> */}
                                    <Col span={8}>
                                        <BaseTextArea
                                            name={[field.name, 'note']}
                                            label={t('employee.note')}
                                            placeholder={t('employee.note')}
                                            rows={1}
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

export default Contracts;
