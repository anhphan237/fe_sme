import { RegexValidate } from '@/constants';
import BaseDatePicker from '@/core/components/DatePicker';
import DividerLabel from '@/core/components/Divider/DividerLabel';
import BaseInputNumber from '@/core/components/Input/BaseNumberInput';
import BaseInput from '@/core/components/Input/InputWithLabel';
import BaseSelect from '@/core/components/Select/BaseSelect';
import { useLocale } from '@/i18n';
import { Col, Row } from 'antd';
import moment from 'moment';

import { EmployeeStatus, Gender, MaritalStatus } from '@/interface/employee';

export const convertedDateProps = {
    normalize: (value: any) => {
        return value ? moment(value).format('YYYY-MM-DDTHH:mm:ss') : null;
    },
    getValueProps: (value: any) => {
        return { value: value ? moment(value) : null };
    },
};

const BasicInformation = () => {
    const { t } = useLocale();

    return (
        <div className="overflow-auto h-[calc(100vh-280px)] pr-4">
            <Row gutter={[16, 16]}>
                <DividerLabel label={t('employee.personal_info')} />
                <Col span={3}>
                    <BaseInput name="code" label={t('employee.code')} placeholder={t('employee.auto_generate')} disabled />
                </Col>
                <Col span={5}>
                    <BaseInput
                        name="fullName"
                        label={t('employee.full_name')}
                        placeholder={t('employee.full_name')}
                        formItemProps={{
                            rules: [
                                { required: true, message: t('global.message.required_field') },
                                { max: 100, message: t('global.message.max_length', { length: 100 }) },
                            ],
                        }}
                    />
                </Col>

                <Col span={2}>
                    <BaseSelect
                        name="gender"
                        label={t('employee.gender')}
                        placeholder={t('employee.gender')}
                        options={[
                            { value: Gender.FEMALE, label: t('employee.gender.female') },
                            { value: Gender.MALE, label: t('employee.gender.male') },
                        ]}
                        formItemProps={{ rules: [{ required: true, message: t('global.message.required_field') }] }}
                    />
                </Col>
                <Col span={4}>
                    <BaseInput
                        name="taxCode"
                        label={t('employee.tax_code')}
                        placeholder={t('employee.tax_code')}
                        formItemProps={{
                            rules: [
                                { required: true, message: t('global.message.required_field') },
                                { pattern: RegexValidate.TAX_CODE, message: t('global.message.invalid_tax_code') },
                            ],
                        }}
                    />
                </Col>
                <Col span={3}>
                    <BaseDatePicker
                        name="dateOfBirth"
                        label={t('employee.date_of_birth')}
                        placeholder={t('employee.date_of_birth')}
                        format="DD-MM-YYYY"
                        className="w-full"
                        formItemProps={{
                            ...convertedDateProps,
                            rules: [{ required: true, message: t('global.message.required_field') }],
                        }}
                    />
                </Col>

                <Col span={5}>
                    <BaseInput name="placeOfBirth" label={t('employee.place_of_birth')} placeholder={t('employee.place_of_birth')} />
                </Col>

                <Col span={2}>
                    <BaseInput name="ethnicity" label={t('employee.ethnicity')} placeholder={t('employee.ethnicity')} />
                </Col>

                <Col span={3}>
                    <BaseInput name="nationality" label={t('employee.nationality')} placeholder={t('employee.nationality')} />
                </Col>

                <Col span={4}>
                    <BaseSelect
                        name="maritalStatus"
                        label={t('employee.marital_status')}
                        placeholder={t('employee.marital_status')}
                        options={[
                            { value: MaritalStatus.SINGLE, label: t('employee.marital.single') },
                            { value: MaritalStatus.MARRIED, label: t('employee.marital.married') },
                            { value: MaritalStatus.DIVORCED, label: t('employee.marital.divorced') },
                            { value: MaritalStatus.WIDOWED, label: t('employee.marital.widowed') },
                            { value: MaritalStatus.SEPARATED, label: t('employee.marital.separated') },
                        ]}
                    />
                </Col>

                <DividerLabel label={t('employee.work_info')} />

                <Col span={4}>
                    <BaseDatePicker
                        name="hireDate"
                        label={t('employee.hire_date')}
                        placeholder={t('employee.hire_date')}
                        format="DD-MM-YYYY"
                        className="w-full"
                        formItemProps={{
                            ...convertedDateProps,
                            rules: [{ required: true, message: t('global.message.required_field') }],
                        }}
                    />
                </Col>

                <Col span={4}>
                    <BaseSelect
                        name="status"
                        label={t('employee.status_label')}
                        placeholder={t('employee.status_label')}
                        options={[
                            { value: EmployeeStatus.PROBATION, label: t('employee.status.probation') },
                            { value: EmployeeStatus.OFFICIAL, label: t('employee.status.official') },
                            { value: EmployeeStatus.RESIGNED, label: t('employee.status.resigned') },
                            { value: EmployeeStatus.RETIRED, label: t('employee.status.retired') },
                            { value: EmployeeStatus.TERMINATED, label: t('employee.status.terminated') },
                            { value: EmployeeStatus.MATERNITY_LEAVE, label: t('employee.status.maternity_leave') },
                        ]}
                        formItemProps={{ rules: [{ required: true }] }}
                    />
                </Col>

                <Col span={4}>
                    <BaseInputNumber
                        name="salary"
                        label={t('employee.salary')}
                        placeholder={t('employee.salary')}
                        min={1}
                        isMoneyFormat
                        formItemProps={{
                            rules: [{ required: true, message: t('global.message.required_field') }],
                        }}
                    />
                </Col>
                <Col span={6}>
                    <BaseInput
                        name="workEmail"
                        label={t('employee.work_email')}
                        placeholder={t('employee.work_email')}
                        formItemProps={{
                            rules: [{ type: 'email', message: t('global.message.invalid_email') }],
                            required: true,
                        }}
                    />
                </Col>

                <DividerLabel label={t('employee.contact_info')} />

                <Col span={6}>
                    <BaseInput
                        name={['contact', 'mobilePhone']}
                        label={t('employee.mobile_phone')}
                        placeholder={t('employee.mobile_phone')}
                        formItemProps={{
                            rules: [
                                { required: true, message: t('customer.phone.required') },
                                { pattern: RegexValidate.PHONE, message: t('global.phone_number.format') },
                            ],
                        }}
                    />
                </Col>

                <Col span={6}>
                    <BaseInput
                        name={['contact', 'workPhone']}
                        label={t('employee.work_phone')}
                        placeholder={t('employee.work_phone')}
                        formItemProps={{
                            rules: [{ pattern: RegexValidate.PHONE, message: t('global.message.invalid_phone') }],
                            // required: true,
                        }}
                    />
                </Col>
                <Col span={6}>
                    <BaseInput
                        name={['contact', 'otherPhone']}
                        label={t('employee.other_phone')}
                        placeholder={t('employee.other_phone')}
                        formItemProps={{
                            rules: [{ pattern: RegexValidate.PHONE, message: t('global.message.invalid_phone') }],
                            // required: true,
                        }}
                    />
                </Col>
                {/* <Col span={12}>
                    <BaseInput
                        name={['contact', 'workEmail']}
                        label={t('employee.work_email')}
                        placeholder={t('employee.work_email')}
                        formItemProps={{
                            rules: [
                                { required: true, message: t('global.message.required_field') },
                                { type: 'email', message: t('global.message.invalid_email') },
                            ],
                        }}
                    />
                </Col> */}

                <Col span={6}>
                    <BaseInput
                        name={['contact', 'personalEmail']}
                        label={t('employee.personal_email')}
                        placeholder={t('employee.personal_email')}
                        formItemProps={{
                            rules: [{ type: 'email', message: t('global.message.invalid_email') }],
                            // required: true,
                        }}
                    />
                </Col>

                <DividerLabel label={t('employee.address_info')} />

                <Col span={3}>
                    <BaseInput
                        name={['address', 'addressType']}
                        label={t('employee.address_type')}
                        placeholder={t('employee.address_type')}
                        formItemProps={{ rules: [{ required: true, message: t('global.message.required_field') }] }}
                    />
                </Col>
                <Col span={3}>
                    <BaseInput
                        name={['address', 'country']}
                        label={t('employee.country')}
                        placeholder={t('employee.country')}
                        formItemProps={{ rules: [{ required: true, message: t('global.message.required_field') }] }}
                    />
                </Col>

                <Col span={3}>
                    <BaseInput
                        name={['address', 'city']}
                        label={t('employee.city')}
                        placeholder={t('employee.city')}
                        formItemProps={{ rules: [{ required: true, message: t('global.message.required_field') }] }}
                    />
                </Col>

                <Col span={4}>
                    <BaseInput name={['address', 'district']} label={t('employee.district')} placeholder={t('employee.district')} />
                </Col>

                <Col span={4}>
                    <BaseInput name={['address', 'ward']} label={t('employee.ward')} placeholder={t('employee.ward')} />
                </Col>

                <Col span={7}>
                    <BaseInput name={['address', 'street']} label={t('employee.street')} placeholder={t('employee.street')} />
                </Col>
            </Row>
        </div>
    );
};

export default BasicInformation;
