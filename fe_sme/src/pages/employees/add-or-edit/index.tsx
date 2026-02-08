import { apiAddEmployee, apiGetEmployeeById, apiUpdateEmployee } from '@/api/employee.api';
import { AppRouters } from '@/constants';
import BaseCheckbox from '@/core/components/Checkbox';
import { useLocale } from '@/i18n';
import { useAppDispatch } from '@/stores';
import { useQuery } from '@tanstack/react-query';
import { Form, Spin, Tabs, UploadFile } from 'antd';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import BaseButton from '@/components/button';
import { notify } from '@/components/toast-message';

import { setBreadCrumbs } from '@/stores/global.store';

import { handleCommonError } from '@/utils/helpers';

import { EmployeeStatus, Gender, IAddEditEmployee, MaritalStatus } from '@/interface/employee';

import AvatarSection from './AvatarSection';
import BasicInformation from './BasicInformation';
import Contracts from './Contracts';
import Education from './Education';
import EmergencyContacts from './EmergencyContacts';
import IdentityDocuments from './IdentityDocuments';

const { TabPane } = Tabs;

const AddOrEdit = () => {
    const { t } = useLocale();
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [form] = Form.useForm<IAddEditEmployee>();

    const isEdit = !!id && id !== 'add';
    const [fileList, setFileList] = useState<UploadFile[]>([]);

    const { data: employeeDetail, refetch } = useQuery({
        queryKey: ['getDetailEmployee', id],
        queryFn: async () => {
            const res = await apiGetEmployeeById(id || '', { loading: false });
            if (id) {
                dispatch(
                    setBreadCrumbs({
                        [id]: t('employee.edit'),
                    }),
                );
            }

            if (res?.data) {
                const employeeData = res.data;

                const transformedData: any = {
                    ...employeeData,
                    hireDate: employeeData.hireDate ? moment(employeeData.hireDate).format('YYYY-MM-DD') : null,
                    dateOfBirth: employeeData.dateOfBirth ? moment(employeeData.dateOfBirth).format('YYYY-MM-DD') : null,

                    identityDocuments:
                        employeeData.identityDocuments?.map((doc: any, index: number) => ({
                            ...doc,
                            number: index + 1,
                            issueDate: doc.issueDate ? moment(doc.issueDate).format('YYYY-MM-DD') : null,
                            expiryDate: doc.expiryDate ? moment(doc.expiryDate).format('YYYY-MM-DD') : null,
                        })) || [],

                    educations:
                        employeeData.educations?.map((edu: any, index: number) => ({
                            ...edu,
                            number: index + 1,
                        })) || [],

                    emergencyContacts:
                        employeeData.emergencyContacts?.map((contact: any, index: number) => ({
                            ...contact,
                            number: index + 1,
                        })) || [],

                    contracts:
                        employeeData.contracts?.map((contract: any, index: number) => ({
                            ...contract,
                            number: index + 1,
                            startDate: contract.startDate ? moment(contract.startDate).format('YYYY-MM-DD') : null,
                            endDate: contract.endDate ? moment(contract.endDate).format('YYYY-MM-DD') : null,
                        })) || [],

                    contact: employeeData.contact,
                    address: employeeData.address,
                };

                form.setFieldsValue(transformedData);

                if (employeeData.avatar) {
                    setFileList([
                        {
                            uid: '-1',
                            name: 'avatar.jpg',
                            status: 'done',
                            url: employeeData.avatar,
                        } as any,
                    ]);
                }
            }

            return res?.data;
        },

        enabled: isEdit,
    });

    const handleClose = () => {
        navigate(AppRouters.EMPLOYEES);
    };

    const handleSubmit = async () => {
        try {
            await form.validateFields();
            const data: IAddEditEmployee = form.getFieldsValue(true);

            const params: any = {
                ...(isEdit && employeeDetail?.id && { id: employeeDetail.id }),
                ...data,
                hireDate: data.hireDate ? moment(data.hireDate).format('YYYY-MM-DD') : null,
                dateOfBirth: data.dateOfBirth ? moment(data.dateOfBirth).format('YYYY-MM-DD') : null,

                identityDocuments: (data?.identityDocuments ?? []).map((doc: any, index: number) => {
                    const { id, number, ...rest } = doc;
                    return {
                        ...rest,
                        issueDate: doc.issueDate ? moment(doc.issueDate).format('YYYY-MM-DD') : null,
                        expiryDate: doc.expiryDate ? moment(doc.expiryDate).format('YYYY-MM-DD') : null,
                    };
                }),

                educations: (data?.educations ?? []).map((edu: any, index: number) => {
                    const { id, number, ...rest } = edu;
                    return rest;
                }),

                emergencyContacts: (data?.emergencyContacts ?? []).map((contact: any, index: number) => {
                    const { id, number, ...rest } = contact;
                    return rest;
                }),

                contracts: (data?.contracts ?? []).map((contract: any, index: number) => {
                    const { id, number, ...rest } = contract;
                    return {
                        ...rest,
                        startDate: contract.startDate ? moment(contract.startDate).format('YYYY-MM-DD') : null,
                        endDate: contract.endDate ? moment(contract.endDate).format('YYYY-MM-DD') : null,
                    };
                }),

                contact: {
                    mobilePhone: data.contact?.mobilePhone || '',
                    workPhone: data.contact?.workPhone,
                    otherPhone: data.contact?.otherPhone,
                    personalEmail: data.contact?.personalEmail,
                },

                address: {
                    addressType: data.address?.addressType || 'HOME',
                    country: data.address?.country || '',
                    city: data.address?.city || '',
                    district: data.address?.district,
                    ward: data.address?.ward,
                    street: data.address?.street,
                },
            };

            const res = isEdit ? await apiUpdateEmployee(params) : await apiAddEmployee(params);

            if (res?.succeeded) {
                notify.success(isEdit ? t('message.update_success') : t('message.add_success'));

                if (data?.isSaveAdd && !isEdit) {
                    form.resetFields();
                    setFileList([]);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    navigate(AppRouters.EMPLOYEES);
                }
            } else {
                notify.error(res?.message || t('message.failed'));
            }
        } catch (error) {
            handleCommonError(error, t);
        }
    };

    return (
        <div className="py-4 px-8 h-[calc(100vh-104px)]">
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                className="h-full flex flex-col"
                initialValues={
                    !isEdit
                        ? {
                              gender: Gender.MALE,
                              maritalStatus: MaritalStatus.SINGLE,
                              status: EmployeeStatus.PROBATION,
                              hireDate: moment(),
                              identityDocuments: [],
                              educations: [],
                              emergencyContacts: [],
                              contracts: [],
                              contact: {},
                              address: {},
                          }
                        : undefined
                }
                preserve
            >
                <div className="flex gap-6 flex-1 ">
                    <div className="w-1/5 bg-white rounded-lg p-4 flex flex-col items-center shadow-sm h-full">
                        <AvatarSection fileList={fileList} setFileList={setFileList} form={form} />
                    </div>

                    <div className="flex-1 flex flex-col bg-white rounded-lg p-6 shadow-sm h-full overflow-hidden">
                        <div className="flex-1 overflow-auto pr-2">
                            <Tabs defaultActiveKey="1">
                                <TabPane tab={t('employee.tab.basic_info')} key="1">
                                    <BasicInformation />
                                </TabPane>
                                <TabPane tab={t('employee.tab.identity_documents')} key="2">
                                    <IdentityDocuments />
                                </TabPane>
                                <TabPane tab={t('employee.tab.education')} key="3">
                                    <Education />
                                </TabPane>
                                <TabPane tab={t('employee.tab.emergency_contacts')} key="4">
                                    <EmergencyContacts />
                                </TabPane>
                                <TabPane tab={t('employee.tab.contracts')} key="5">
                                    <Contracts />
                                </TabPane>
                            </Tabs>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg mt-4  p-4 flex justify-end items-center gap-2 shadow-sm">
                    {!isEdit && <BaseCheckbox name="isSaveAdd" labelCheckbox={t('global.save_and_add')} />}
                    <BaseButton label={t('global.popup.reject')} onClick={handleClose} disabled={false} />
                    <BaseButton label={t('global.popup.save')} type="primary" htmlType="submit" />
                </div>
            </Form>
        </div>
    );
};

export default AddOrEdit;
