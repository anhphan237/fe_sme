import BaseDatePicker from '@/core/components/DatePicker';
import BaseInputNumber from '@/core/components/Input/BaseNumberInput';
import BaseInput from '@/core/components/Input/InputWithLabel';
import BaseSelect from '@/core/components/Select/BaseSelect';
import { useLocale } from '@/i18n';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Row } from 'antd';

import BaseButton from '@/components/button';

import { convertedDateProps } from '@/utils/helpers';

import { EducationLevel } from '@/interface/employee';

const Education = () => {
    const { t } = useLocale();

    return (
        <div className="overflow-auto h-[calc(100vh-280px)] pr-4">
            <Form.List name="educations">
                {(fields, { add, remove }) => (
                    <>
                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} className="mb-4">
                            {t('employee.add_education')}
                        </Button>
                        {fields.map((field, index) => (
                            <Card
                                key={field.key}
                                size="small"
                                title={`${t('employee.education')} #${index + 1}`}
                                extra={<BaseButton danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />}
                                className="mb-4"
                            >
                                <Row gutter={[16, 16]}>
                                    <Col span={6}>
                                        <BaseInput
                                            name={[field.name, 'school']}
                                            label={t('employee.school')}
                                            placeholder={t('employee.school')}
                                            formItemProps={{
                                                rules: [{ required: true, message: t('global.message.required_field') }],
                                            }}
                                        />
                                    </Col>
                                    <Col span={4}>
                                        <BaseSelect
                                            name={[field.name, 'educationLevel']}
                                            label={t('employee.education_level')}
                                            placeholder={t('employee.education_level')}
                                            options={[
                                                { value: EducationLevel.HIGH_SCHOOL, label: t('employee.education.high_school') },
                                                { value: EducationLevel.VOCATIONAL, label: t('employee.education.vocational') },
                                                { value: EducationLevel.COLLEGE, label: t('employee.education.college') },
                                                { value: EducationLevel.UNIVERSITY, label: t('employee.education.university') },
                                                { value: EducationLevel.MASTER, label: t('employee.education.master') },
                                                { value: EducationLevel.DOCTOR, label: t('employee.education.doctor') },
                                                { value: EducationLevel.OTHER, label: t('employee.education.other') },
                                            ]}
                                            formItemProps={{
                                                rules: [{ required: true, message: t('global.message.required_field') }],
                                            }}
                                        />
                                    </Col>

                                    <Col span={6}>
                                        <BaseInputNumber name={[field.name, 'major']} label={t('employee.major')} placeholder={t('employee.major')} />
                                    </Col>
                                    {/* <Col span={12}>
                                        <BaseDatePicker
                                            name={[field.name, 'startDate']}
                                            label={t('employee.start_date')}
                                            placeholder={t('employee.start_date')}
                                            format="YYYY"
                                            picker="year"
                                            className="w-full"
                                            formItemProps={convertedDateProps}
                                        />
                                    </Col>

                                    <Col span={12}>
                                        <BaseDatePicker
                                            name={[field.name, 'endDate']}
                                            label={t('employee.end_date')}
                                            placeholder={t('employee.end_date')}
                                            format="YYYY"
                                            picker="year"
                                            className="w-full"
                                            formItemProps={convertedDateProps}
                                        />
                                    </Col> */}
                                    <Col span={4}>
                                        <BaseInputNumber
                                            name={[field.name, 'graduationYear']}
                                            label={t('employee.graduation_year')}
                                            placeholder={t('employee.graduation_year')}
                                        />
                                    </Col>
                                    {/* <Col span={12}>
                                        <BaseDatePicker
                                            name={[field.name, 'graduationYear']}
                                            label={t('employee.graduation_year')}
                                            placeholder={t('employee.graduation_year')}
                                            format="YYYY"
                                            picker="year"
                                            className="w-full"
                                            formItemProps={{
                                                ...convertedDateProps,
                                            }}
                                        />
                                    </Col> */}
                                    <Col span={4}>
                                        <BaseInput
                                            name={[field.name, 'classification']}
                                            label={t('employee.classification')}
                                            placeholder={t('employee.classification')}
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

export default Education;
