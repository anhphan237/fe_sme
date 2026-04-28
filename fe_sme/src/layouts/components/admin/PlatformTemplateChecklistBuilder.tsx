import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
} from "antd";
import { Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { useLocale } from "@/i18n";
import { stageOptions, itemStatusOptions } from "@/constants/admin-platform";


const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface Props {
  checklistCount: number;
  taskCount: number;
}

const PlatformTemplateChecklistBuilder = ({
  checklistCount,
  taskCount,
}: Props) => {
  const { t } = useLocale();

  const translatedStageOptions = useMemo(
    () =>
      stageOptions.map((item) => ({
        label: t(item.labelKey),
        value: item.value,
      })),
    [t],
  );

  const translatedStatusOptions = useMemo(
    () =>
      itemStatusOptions.map((item) => ({
        label: t(item.labelKey),
        value: item.value,
      })),
    [t],
  );

  return (
    <Card
      title={
        <div>
          <Text strong>{t("platform.templates.builder.title")}</Text>
          <Paragraph className="!mb-0 !mt-1 text-sm text-gray-500">
            {t("platform.templates.builder.subtitle")}
          </Paragraph>
        </div>
      }
      className="mt-4 rounded-2xl shadow-sm"
      extra={
        <Space>
          <Tag color="blue">
            {checklistCount} {t("platform.templates.checklists")}
          </Tag>
          <Tag color="green">
            {taskCount} {t("platform.templates.tasks")}
          </Tag>
        </Space>
      }
    >
      <Form.List
        name="checklists"
        rules={[
          {
            validator: async (_, checklists) => {
              if (!checklists || checklists.length < 1) {
                throw new Error(t("platform.templates.validation.checklist_min"));
              }
            },
          },
        ]}
      >
        {(checklistFields, { add: addChecklist, remove: removeChecklist }, { errors }) => (
          <div className="space-y-5">
            {checklistFields.map((checklistField, checklistIndex) => (
              <Card
                key={checklistField.key}
                size="small"
                className="rounded-2xl border border-gray-200 bg-white"
                title={
                  <Space wrap>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-600">
                      {checklistIndex + 1}
                    </div>
                    <Text strong>{t("platform.templates.builder.checklist")}</Text>
                  </Space>
                }
                extra={
                  checklistFields.length > 1 ? (
                    <Popconfirm
                      title={t("platform.templates.builder.delete_checklist_confirm")}
                      okText={t("global.delete")}
                      cancelText={t("global.cancel")}
                      onConfirm={() => removeChecklist(checklistField.name)}
                    >
                      <Button danger type="text" size="small" icon={<Trash2 size={15} />}>
                        {t("global.delete")}
                      </Button>
                    </Popconfirm>
                  ) : null
                }
              >
                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name={[checklistField.name, "name"]}
                      label={t("platform.templates.builder.checklist_name")}
                      rules={[
                        {
                          required: true,
                          message: t("platform.templates.validation.checklist_name_required"),
                        },
                      ]}
                    >
                      <Input placeholder={t("platform.templates.builder.checklist_name_placeholder")} />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={6}>
                    <Form.Item
                      name={[checklistField.name, "stage"]}
                      label={t("platform.templates.builder.stage")}
                      rules={[
                        {
                          required: true,
                          message: t("platform.templates.validation.stage_required"),
                        },
                      ]}
                    >
                      <Select options={translatedStageOptions} />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={5}>
                    <Form.Item
                      name={[checklistField.name, "deadlineDays"]}
                      label={t("platform.templates.builder.deadline_days")}
                      rules={[
                        {
                          required: true,
                          message: t("platform.templates.validation.deadline_required"),
                        },
                        {
                          type: "number",
                          min: 0,
                          message: t("platform.templates.validation.deadline_min"),
                        },
                      ]}
                    >
                      <InputNumber className="w-full" min={0} />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={5}>
                    <Form.Item
                      name={[checklistField.name, "status"]}
                      label={t("global.status")}
                      rules={[
                        {
                          required: true,
                          message: t("platform.templates.validation.status_required"),
                        },
                      ]}
                    >
                      <Select options={translatedStatusOptions} />
                    </Form.Item>
                  </Col>

                  <Form.Item name={[checklistField.name, "sortOrder"]} hidden>
                    <InputNumber />
                  </Form.Item>
                </Row>

                <Divider plain>{t("platform.templates.builder.tasks")}</Divider>

                <Form.List
                  name={[checklistField.name, "tasks"]}
                  rules={[
                    {
                      validator: async (_, tasks) => {
                        if (!tasks || tasks.length < 1) {
                          throw new Error(t("platform.templates.validation.task_min"));
                        }
                      },
                    },
                  ]}
                >
                  {(taskFields, { add: addTask, remove: removeTask }, { errors: taskErrors }) => (
                    <div className="space-y-3">
                      {taskFields.map((taskField, taskIndex) => (
                        <Card
                          key={taskField.key}
                          size="small"
                          className="rounded-xl border border-gray-100 bg-slate-50"
                          title={
                            <Space wrap>
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-gray-600">
                                {taskIndex + 1}
                              </div>
                              <Text>{t("platform.templates.builder.task")}</Text>
                            </Space>
                          }
                          extra={
                            taskFields.length > 1 ? (
                              <Button
                                danger
                                type="text"
                                size="small"
                                icon={<Trash2 size={15} />}
                                onClick={() => removeTask(taskField.name)}
                              >
                                {t("platform.templates.builder.delete_task")}
                              </Button>
                            ) : null
                          }
                        >
                          <Row gutter={16}>
                            <Col xs={24} md={14}>
                              <Form.Item
                                name={[taskField.name, "title"]}
                                label={t("platform.templates.builder.task_title")}
                                rules={[
                                  {
                                    required: true,
                                    message: t("platform.templates.validation.task_title_required"),
                                  },
                                ]}
                              >
                                <Input placeholder={t("platform.templates.builder.task_title_placeholder")} />
                              </Form.Item>
                            </Col>

                            <Col xs={24} md={5}>
                              <Form.Item
                                name={[taskField.name, "status"]}
                                label={t("global.status")}
                                rules={[
                                  {
                                    required: true,
                                    message: t("platform.templates.validation.status_required"),
                                  },
                                ]}
                              >
                                <Select options={translatedStatusOptions} />
                              </Form.Item>
                            </Col>

                            <Col xs={24} md={5}>
                              <Form.Item
                                name={[taskField.name, "sortOrder"]}
                                label={t("platform.templates.builder.display_order")}
                              >
                                <InputNumber className="w-full" min={0} />
                              </Form.Item>
                            </Col>

                            <Col xs={24}>
                              <Form.Item
                                name={[taskField.name, "description"]}
                                label={t("platform.templates.builder.task_description")}
                              >
                                <TextArea
                                  rows={2}
                                  placeholder={t("platform.templates.builder.task_description_placeholder")}
                                />
                              </Form.Item>
                            </Col>

                            <Col xs={24}>
                              <div className="rounded-xl border border-gray-100 bg-white p-4">
                                <Space size="large" wrap>
                                  <Form.Item
                                    name={[taskField.name, "requireAck"]}
                                    label={t("platform.templates.builder.require_ack")}
                                    valuePropName="checked"
                                    className="!mb-0"
                                  >
                                    <Switch />
                                  </Form.Item>

                                  <Form.Item
                                    name={[taskField.name, "requireDoc"]}
                                    label={t("platform.templates.builder.require_doc")}
                                    valuePropName="checked"
                                    className="!mb-0"
                                  >
                                    <Switch />
                                  </Form.Item>

                                  <Form.Item
                                    name={[taskField.name, "requiresManagerApproval"]}
                                    label={t("platform.templates.builder.manager_approval")}
                                    valuePropName="checked"
                                    className="!mb-0"
                                  >
                                    <Switch />
                                  </Form.Item>
                                </Space>
                              </div>
                            </Col>
                          </Row>
                        </Card>
                      ))}

                      <Form.ErrorList errors={taskErrors} />

                      <Button
                        type="dashed"
                        block
                        icon={<Plus size={16} />}
                        onClick={() =>
                          addTask({
                            title: "",
                            description: "",
                            requireAck: false,
                            requireDoc: false,
                            requiresManagerApproval: false,
                            sortOrder: taskFields.length,
                            status: "ACTIVE",
                          })
                        }
                      >
                        {t("platform.templates.builder.add_task")}
                      </Button>
                    </div>
                  )}
                </Form.List>
              </Card>
            ))}

            <Form.ErrorList errors={errors} />

            <Button
              type="dashed"
              block
              icon={<Plus size={16} />}
              onClick={() =>
                addChecklist({
                  name: "",
                  stage: "CUSTOM",
                  deadlineDays: 0,
                  sortOrder: checklistFields.length,
                  status: "ACTIVE",
                  tasks: [
                    {
                      title: "",
                      description: "",
                      requireAck: false,
                      requireDoc: false,
                      requiresManagerApproval: false,
                      sortOrder: 0,
                      status: "ACTIVE",
                    },
                  ],
                })
              }
            >
              {t("platform.templates.builder.add_checklist")}
            </Button>
          </div>
        )}
      </Form.List>
    </Card>
  );
};

export default PlatformTemplateChecklistBuilder;