import { apiSearchUsers } from '@/api/user.api';
import DividerLabel from '@/core/components/Divider/DividerLabel';
import BaseInput from '@/core/components/Input/InputWithLabel';
import InfiniteScrollSelect from '@/core/components/Select/InfinitieScroll';
import { useLocale } from '@/i18n';
import { Col, Form, Row } from 'antd';

const PersonInCharge = () => {
    const { t } = useLocale();
    const form = Form.useFormInstance();

    const getPositionNames = (user: any) => user.positions?.map((p: any) => p.name || p.positionName || p.id)?.join(', ') || '';

    const handleChangePersonInCharge = (_: string, option: any) => {
        if (!option || Array.isArray(option)) return;

        const { id, fullName, phoneNumber, email, positions } = option;

        form.setFieldsValue({
            personInCharge: {
                userId: id,
                userCode: option.code,
                userName: fullName,
                userPhone: phoneNumber,
                userEmail: email,
                userPosition: positions?.map((p: any) => p.id)?.join(';'),
                _positionNames: getPositionNames(option),
            },
        });
    };

    return (
        <Row gutter={[16, 16]} className="mb-6">
            <DividerLabel label={t('customer.person_in_charge')} />

            <Col span={6}>
                <InfiniteScrollSelect
                    name={['personInCharge', 'userId']}
                    queryKey={['searchUsersForOrder']}
                    label={t('customer.person_in_charge_name')}
                    placeholder={t('customer.select_person_in_charge')}
                    labelRender={value => value?.label ?? form.getFieldValue(['personInCharge', 'userName'])}
                    formItemProps={{
                        required: true,
                        rules: [
                            {
                                required: true,
                                message: t('customer.person_in_charge_name.required'),
                            },
                        ],
                        labelAlign: 'left',
                    }}
                    showSearch
                    fetchData={async ({ pageNumber, pageSize, search }) => {
                        const resp = await apiSearchUsers(pageNumber, pageSize, search || '', { loading: false });
                        return resp.data;
                    }}
                    onChange={handleChangePersonInCharge}
                    mapData={(data: any[]) =>
                        data.map(user => ({
                            key: user.id,
                            value: user.id,
                            label: user.fullName,
                            ...user,
                            positionNames: getPositionNames(user),
                        }))
                    }
                />
            </Col>

            <Col span={6}>
                <BaseInput
                    name={['personInCharge', 'userPhone']}
                    label={t('customer.phone')}
                    placeholder={t('customer.phone')}
                    disabled
                    formItemProps={{
                        labelAlign: 'left',
                    }}
                />
            </Col>

            <Col span={6}>
                <BaseInput
                    name={['personInCharge', 'userEmail']}
                    label={t('customer.email')}
                    placeholder={t('customer.email')}
                    disabled
                    formItemProps={{
                        labelAlign: 'left',
                    }}
                />
            </Col>

            <Col span={6}>
                <BaseInput
                    name={['personInCharge', '_positionNames']}
                    label={t('global.position')}
                    placeholder={t('global.position')}
                    disabled
                    formItemProps={{
                        labelAlign: 'left',
                    }}
                />
            </Col>
        </Row>
    );
};

export default PersonInCharge;
