// import { apiAddShift, apiUpdateShift } from '@/api/attendance.api';
// import { useLocale } from '@/i18n';
// import { Drawer, Form, Input, InputNumber, Select, Switch, TimePicker } from 'antd';
// import dayjs from 'dayjs';
// import { useEffect, useState } from 'react';

// import BaseButton from '@/components/button';
// import { notify } from '@/components/toast-message';

// import { handleCommonError } from '@/utils/helpers';

// import { IAddEditAttendanceShift, IAttendanceShiftData, ShiftType } from '@/interface/attendance';

// interface ShiftFormDrawerProps {
//     visible: boolean;
//     onClose: () => void;
//     onSuccess: () => void;
//     record: IAttendanceShiftData | null;
// }

// export default function ShiftFormDrawer({ visible, onClose, onSuccess, record }: ShiftFormDrawerProps) {
//     const { t } = useLocale();
//     const [form] = Form.useForm();
//     const [loading, setLoading] = useState(false);

//     const isCreate = !record;

//     useEffect(() => {
//         if (visible) {
//             if (record) {
//                 // Edit mode with existing data
//                 const startTime = dayjs(record.startTime, 'HH:mm:ss');
//                 const endTime = dayjs(record.endTime, 'HH:mm:ss');

//                 form.setFieldsValue({
//                     code: record.code,
//                     name: record.name,
//                     shiftType: record.shiftType,
//                     startTime,
//                     endTime,
//                     gracePeriodMinutes: record.gracePeriodMinutes,
//                     requiredWorkingHours: record.requiredWorkingHours,
//                     isActive: record.isActive,
//                     description: record.description,
//                 });
//             } else {
//                 // Create mode with default values
//                 form.resetFields();
//                 form.setFieldsValue({
//                     shiftType: ShiftType.MORNING,
//                     gracePeriodMinutes: 15,
//                     requiredWorkingHours: 8,
//                     isActive: true,
//                 });
//             }
//         }
//     }, [visible, record, form]);

//     const handleSubmit = async () => {
//         try {
//             setLoading(true);
//             const values = await form.validateFields();

//             const payload: IAddEditAttendanceShift = {
//                 id: record?.id,
//                 code: values.code || undefined,
//                 name: values.name,
//                 shiftType: values.shiftType,
//                 startTime: values.startTime.format('HH:mm:ss'),
//                 endTime: values.endTime.format('HH:mm:ss'),
//                 gracePeriodMinutes: values.gracePeriodMinutes,
//                 requiredWorkingHours: values.requiredWorkingHours,
//                 isActive: values.isActive,
//                 description: values.description || undefined,
//             };

//             const response = isCreate ? await apiAddShift(payload) : await apiUpdateShift(payload);

//             if (response.succeeded) {
//                 notify.success(t(isCreate ? 'shift.message.create_success' : 'shift.message.update_success'));
//                 onSuccess();
//             } else {
//                 throw response;
//             }
//         } catch (error: any) {
//             if (error.errors) {
//                 // Form validation error
//                 console.error('Form validation failed:', error);
//             } else {
//                 handleCommonError(error, t);
//             }
//         } finally {
//             setLoading(false);
//         }
//     };

//     const getTitle = () => {
//         return isCreate ? t('shift.add') : t('shift.edit');
//     };

//     return (
//         <Drawer
//             title={getTitle()}
//             placement="right"
//             onClose={onClose}
//             open={visible}
//             width={600}
//             footer={
//                 <div className="flex justify-end gap-2">
//                     <BaseButton onClick={onClose} label="global.cancel" />
//                     <BaseButton type="primary" onClick={handleSubmit} loading={loading} label="global.save" />
//                 </div>
//             }
//         >
//             <Form form={form} layout="vertical" className="mt-4">
//                 <Form.Item name="code" label={t('shift.code')}>
//                     <Input placeholder={t('shift.placeholder.code')} disabled={!isCreate} />
//                 </Form.Item>

//                 <Form.Item name="name" label={t('shift.name')} rules={[{ required: true, message: t('shift.validation.name_required') }]}>
//                     <Input placeholder={t('shift.placeholder.name')} />
//                 </Form.Item>

//                 <Form.Item name="shiftType" label={t('shift.type')} rules={[{ required: true, message: t('shift.validation.type_required') }]}>
//                     <Select placeholder={t('shift.validation.type_required')}>
//                         <Select.Option value={ShiftType.MORNING}>{t('shift.type.morning')}</Select.Option>
//                         <Select.Option value={ShiftType.AFTERNOON}>{t('shift.type.afternoon')}</Select.Option>
//                         <Select.Option value={ShiftType.NIGHT}>{t('shift.type.night')}</Select.Option>
//                         <Select.Option value={ShiftType.FLEXIBLE}>{t('shift.type.flexible')}</Select.Option>
//                     </Select>
//                 </Form.Item>

//                 <Form.Item
//                     name="startTime"
//                     label={t('shift.start_time')}
//                     rules={[{ required: true, message: t('shift.validation.start_time_required') }]}
//                 >
//                     <TimePicker format="HH:mm" style={{ width: '100%' }} />
//                 </Form.Item>

//                 <Form.Item name="endTime" label={t('shift.end_time')} rules={[{ required: true, message: t('shift.validation.end_time_required') }]}>
//                     <TimePicker format="HH:mm" style={{ width: '100%' }} />
//                 </Form.Item>

//                 <Form.Item
//                     name="requiredWorkingHours"
//                     label={t('shift.working_hours')}
//                     rules={[{ required: true, message: t('shift.validation.working_hours_required') }]}
//                 >
//                     <InputNumber min={1} max={24} style={{ width: '100%' }} addonAfter="giờ" />
//                 </Form.Item>

//                 <Form.Item
//                     name="gracePeriodMinutes"
//                     label={t('shift.grace_period')}
//                     rules={[{ required: true, message: t('shift.validation.grace_period_required') }]}
//                     extra={t('shift.grace_period_hint')}
//                 >
//                     <InputNumber min={0} max={60} style={{ width: '100%' }} addonAfter="phút" />
//                 </Form.Item>

//                 <Form.Item name="isActive" label={t('shift.status')} valuePropName="checked">
//                     <Switch checkedChildren={t('shift.status.active')} unCheckedChildren={t('shift.status.inactive')} />
//                 </Form.Item>

//                 <Form.Item name="description" label={t('shift.description')}>
//                     <Input.TextArea rows={3} placeholder={t('shift.placeholder.description')} />
//                 </Form.Item>
//             </Form>
//         </Drawer>
//     );
// }
