import { apiCreateAttendance, apiUpdateAttendance } from '@/api/attendance.api';
import { apiSearchEmployee } from '@/api/employee.api';
import BaseDatePicker from '@/core/components/DatePicker';
import BaseFormItem from '@/core/components/Form/BaseFormItem';
import BaseModal from '@/core/components/Modal/BaseModal';
import BaseSelect from '@/core/components/Select/BaseSelect';
import InfiniteScrollSelect from '@/core/components/Select/InfinitieScroll';
import BaseTextArea from '@/core/components/TextArea/BaseTextArea';
import { useLocale } from '@/i18n';
import { Form } from 'antd';
import { useEffect } from 'react';

import BaseButton from '@/components/button';
import { notify } from '@/components/toast-message';

import { handleCommonError } from '@/utils/helpers';

import { IAddEditAttendance } from '@/interface/attendance/attendance';

interface IProps {
    formData: IAddEditAttendance | null;
    handleClose: () => void;
}

const ModalAddEditAttendance = ({ formData, handleClose }: IProps) => {
    const { t } = useLocale();
    const [form] = Form.useForm();

    useEffect(() => {
        if (formData) {
            if (formData.id) {
                // Edit mode
                form.setFieldsValue({
                    employeeId: formData.employeeId,
                    workDate: formData.workDate,
                    status: formData.status,
                    note: formData.note,
                });
            } else {
                // Add mode
                form.resetFields();
                form.setFieldsValue({
                    status: 'PRESENT',
                });
            }
        }
    }, [formData, form]);

    const handleSubmit = async (values: any) => {
        try {
            const payload = {
                employeeId: values.employeeId,
                workDate: values.workDate,
                status: values.status,
                note: values.note,
            };

            const isEdit = !!formData?.id;
            const res = isEdit ? await apiUpdateAttendance(formData!.id!, payload) : await apiCreateAttendance(payload);

            if (res.succeeded) {
                notify.success(isEdit ? t('message.update_success') : t('message.add_success'));
                handleClose();
            } else throw res;
        } catch (error) {
            handleCommonError(error, t);
        }
    };

    return (
        <BaseModal
            title={t(formData?.id ? 'attendance.edit' : 'attendance.add_new')}
            open={!!formData}
            onCancel={handleClose}
            onClose={handleClose}
            centered
            footer={false}
            width={600}
            destroyOnClose
        >
            <Form
                name="form-attendance"
                layout="vertical"
                form={form}
                className="w-full grid grid-cols-1 gap-4"
                onFinish={handleSubmit}
                autoComplete="off"
                onKeyDown={e => {
                    if (e.key === 'Enter') e.preventDefault();
                }}
                preserve
            >
                <InfiniteScrollSelect
                    name="employeeId"
                    queryKey={['getListEmployeeForAttendance']}
                    label={t('attendance.employee')}
                    placeholder={t('attendance.select_employee')}
                    formItemProps={{
                        rules: [{ required: true, message: t('attendance.employee_required') }],
                        required: true,
                    }}
                    disabled={!!formData?.id}
                    showSearch
                    fetchData={async ({ pageNumber, pageSize, search }) => {
                        const resp = await apiSearchEmployee({ pageNumber, pageSize, search });
                        return resp.data;
                    }}
                />

                <BaseDatePicker
                    name="workDate"
                    label={t('attendance.work_date')}
                    format="DD/MM/YYYY"
                    formItemProps={{
                        rules: [{ required: true, message: t('attendance.work_date_required') }],
                        required: true,
                    }}
                />

                <BaseSelect
                    name="status"
                    label={t('attendance.status')}
                    placeholder={t('attendance.select_status')}
                    formItemProps={{
                        rules: [{ required: true, message: t('attendance.status_required') }],
                        required: true,
                    }}
                    options={[
                        { label: t('attendance.status.present'), value: 0 },
                        { label: t('attendance.status.absent'), value: 1 },
                        { label: t('attendance.status.late'), value: 2 },
                        { label: t('attendance.status.leave'), value: 3 },
                    ]}
                />

                <BaseTextArea name="note" label={t('attendance.note')} rows={3} placeholder={t('attendance.note_placeholder')} />

                <BaseFormItem className="flex justify-end items-center !mb-0">
                    <BaseButton label="global.cancel" onClick={handleClose} className="mr-2" />
                    <BaseButton label={formData?.id ? 'global.update' : 'global.create'} type="primary" htmlType="submit" />
                </BaseFormItem>
            </Form>
        </BaseModal>
    );
};

export default ModalAddEditAttendance;
