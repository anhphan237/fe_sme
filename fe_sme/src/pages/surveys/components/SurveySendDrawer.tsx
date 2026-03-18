import { Drawer, Form } from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Dayjs } from "dayjs";
import { useLocale } from "@/i18n";
import { notify } from "@/utils/notify";
import BaseButton from "@/components/button";
import BaseSelect from "@core/components/Select/BaseSelect";
import BaseDatePicker from "@core/components/DatePicker";
import InfiniteScrollSelect from "@core/components/Select/InfinitieScroll";
import { apiSearchUsers } from "@/api/identity/identity.api";
import {
  apiListSurveyTemplates,
  apiScheduleSurvey,
} from "@/api/survey/survey.api";
import { extractList } from "@/api/core/types";
import type { UserListItem } from "@/interface/identity";
import type {
  SurveyTemplateSummary,
  SurveyScheduleRequest,
} from "@/interface/survey";

interface Props {
  open: boolean;
  onClose: () => void;
}

const SurveySendDrawer = ({ open, onClose }: Props) => {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<{
    employeeId: string;
    templateId: string;
    scheduledAt?: Dayjs;
  }>();

  const { data: templatesRaw } = useQuery({
    queryKey: ["survey-templates-for-send"],
    queryFn: () => apiListSurveyTemplates(),
    enabled: open,
  });

  const templates = extractList<SurveyTemplateSummary>(
    templatesRaw,
    "items",
    "templates",
  );

  type UserListItemRaw = UserListItem & Record<string, unknown>;

  const fetchEmployees = async (params: {
    pageNumber: number;
    pageSize: number;
    search?: string;
  }) => {
    const res = await apiSearchUsers({ keyword: params.search });
    return extractList<UserListItem>(
      res,
      "users",
      "items",
    ) as UserListItemRaw[];
  };
  const mapEmployees = (data: UserListItemRaw[]) =>
    data
      .filter((u) => Boolean(u["employeeId"]))
      .map((u) => ({
        label: u.fullName || u.email,
        value: u["employeeId"] as string,
      }));

  const templateOptions = templates.map((tmpl) => ({
    value: tmpl.templateId,
    label: tmpl.name,
  }));

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (payload: SurveyScheduleRequest) => apiScheduleSurvey(payload),
    onSuccess: () => {
      notify.success(t("survey.send.success"));
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["survey-instances"] });
      onClose();
    },
    onError: () => notify.error(t("survey.send.error")),
  });

  const onFinish = async (values: {
    employeeId: string;
    templateId: string;
    scheduledAt?: Dayjs;
  }) => {
    await mutateAsync({
      templateId: values.templateId,
      employeeId: values.employeeId,
      scheduledAt: values.scheduledAt?.toISOString(),
    });
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Drawer
      title={t("survey.send.title")}
      open={open}
      onClose={handleClose}
      width={420}
      destroyOnClose
      footer={
        <div className="flex justify-end gap-2">
          <BaseButton label="global.cancel" onClick={handleClose} />
          <BaseButton
            type="primary"
            htmlType="submit"
            loading={isPending}
            label="survey.send.schedule"
            onClick={() => form.submit()}
          />
        </div>
      }>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <InfiniteScrollSelect
          name="employeeId"
          label={t("survey.send.employee_label")}
          fetchData={fetchEmployees}
          mapData={mapEmployees}
          queryKey={["users-for-survey-send"]}
          placeholder={t("global.select")}
          formItemProps={{ rules: [{ required: true }] }}
        />
        <div className="mt-4">
          <BaseSelect
            name="templateId"
            label={t("survey.send.template_label")}
            options={templateOptions}
            placeholder={t("global.select")}
            formItemProps={{ rules: [{ required: true }] }}
          />
        </div>
        <div className="mt-4">
          <BaseDatePicker
            name="scheduledAt"
            label={t("survey.send.scheduled_at_label")}
            className="w-full"
          />
        </div>
      </Form>
    </Drawer>
  );
};

export default SurveySendDrawer;
