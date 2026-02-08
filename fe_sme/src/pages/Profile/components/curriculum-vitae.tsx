import BaseDatePicker from '@/core/components/DatePicker';
import BaseInput from '@/core/components/Input/InputWithLabel';
import BaseSelect from '@/core/components/Select/BaseSelect';
import { Form } from 'antd';

const CurriculumVitae = () => {
    return (
        <div className="h-full">
            <Form layout="vertical" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                <BaseInput name="lastName" label="Họ và tên đệm" placeholder="Nhập họ tên đệm" formItemProps={{ required: true }} />
                <BaseInput name="firstName" label="Tên" placeholder="Nhập tên" formItemProps={{ required: true }} />
                <BaseInput name="personalTax" label="Mã số thuế cá nhân" placeholder="Nhập mã số thuế" />

                <BaseInput name="workPlace" label="Nơi làm việc" placeholder="Nhập nơi làm việc" />
                <BaseInput name="facebook" label="Facebook" placeholder="Nhập link Facebook" />
                <BaseSelect name="shirtSize" label="Size Shirt" placeholder="Chọn size" options={[]} />

                <BaseDatePicker name="dob" label="Ngày sinh" className="w-full" />
                <BaseInput name="birthPlace" label="Nơi sinh" placeholder="Nhập nơi sinh" />
                <BaseSelect
                    name="gender"
                    label="Giới tính"
                    placeholder="Giới tính"
                    options={[
                        { label: 'Nam', value: 'male' },
                        { label: 'Nữ', value: 'female' },
                    ]}
                />

                <BaseInput name="idNumber" label="Số CMND/CCCD" placeholder="Nhập số CMND/CCCD" />
                <BaseDatePicker name="idIssueDate" label="Ngày cấp" className="w-full" />
                <BaseInput name="idIssuePlace" label="Nơi cấp" placeholder="Nhập nơi cấp" />

                <BaseSelect name="nationality" label="Quốc tịch" placeholder="Quốc tịch" options={[]} />
                <BaseSelect name="ethnicity" label="Dân tộc" placeholder="Dân tộc" options={[]} />
                <BaseSelect name="religion" label="Tôn giáo" placeholder="Tôn giáo" options={[]} />

                <BaseSelect name="maritalStatus" label="Tình trạng hôn nhân" placeholder="Tình trạng hôn nhân" options={[]} />
                <BaseSelect name="residenceType" label="Đối tượng cư trú" placeholder="Đối tượng cư trú" options={[]} />
                <BaseSelect name="experience" label="Kinh nghiệm" placeholder="Kinh nghiệm" options={[]} />

                <BaseSelect name="province" label="Tỉnh/TP" placeholder="Tỉnh/TP" options={[]} />
                <BaseSelect name="district" label="Huyện/Quận" placeholder="Huyện/Quận" options={[]} />
                <BaseSelect name="ward" label="Xã/Phường" placeholder="Xã/Phường" options={[]} />

                <div className="col-span-3">
                    <BaseInput name="address" label="Số nhà, đường phố, thôn xóm" placeholder="Nhập địa chỉ" />
                </div>
            </Form>
        </div>
    );
};

export default CurriculumVitae;
