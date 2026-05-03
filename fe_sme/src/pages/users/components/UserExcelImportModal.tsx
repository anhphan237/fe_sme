import { useRef, useState } from "react";
import {
  Alert,
  Button,
  Col,
  Modal,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
  Upload,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import {
  apiCommitBulkImportExcel,
  apiDownloadBulkImportTemplate,
  apiValidateBulkImportExcel,
} from "@/api/identity/identity.api";
import type {
  BulkUserImportCommitResponse,
  BulkUserImportValidateResponse,
} from "@/interface/identity";
import { useLocale } from "@/i18n";

const { Dragger } = Upload;
const { Text } = Typography;

type Step = "idle" | "validating" | "validated" | "committing" | "done";

interface Props {
  open: boolean;
  onClose: (refetch?: boolean) => void;
}

const DASH = "—";

const extractErrorMessage = (err: unknown, fallback: string): string => {
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
};

export default function UserExcelImportModal({ open, onClose }: Props) {
  const { t } = useLocale();

  const [step, setStep] = useState<Step>("idle");
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [validateResult, setValidateResult] =
    useState<BulkUserImportValidateResponse | null>(null);
  const [commitResult, setCommitResult] =
    useState<BulkUserImportCommitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedFileRef = useRef<File | null>(null);

  const reset = () => {
    setStep("idle");
    setFileList([]);
    setValidateResult(null);
    setCommitResult(null);
    setError(null);
    selectedFileRef.current = null;
  };

  const handleClose = (refetch = false) => {
    reset();
    onClose(refetch);
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await apiDownloadBulkImportTemplate();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "bulk-user-import-template.xlsx";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to download template."));
    }
  };

  const handleValidate = async () => {
    const file = selectedFileRef.current;
    if (!file) return;
    setError(null);
    setStep("validating");
    try {
      const result = await apiValidateBulkImportExcel(file);
      setValidateResult(result);
      setStep("validated");
    } catch (err) {
      setError(extractErrorMessage(err, "Validation failed."));
      setStep("idle");
    }
  };

  const handleCommit = async () => {
    const file = selectedFileRef.current;
    if (!file) return;
    setError(null);
    setStep("committing");
    try {
      const result = await apiCommitBulkImportExcel(file);
      setCommitResult(result);
      setStep("done");
    } catch (err) {
      setError(extractErrorMessage(err, "Import failed."));
      setStep("validated");
    }
  };

  const validateColumns = [
    {
      title: t("user.import.col.row"),
      dataIndex: "rowNumber",
      width: 70,
    },
    {
      title: t("user.import.col.email"),
      dataIndex: "email",
      render: (value: string | null) => value ?? <Text type="secondary">{DASH}</Text>,
    },
    {
      title: t("user.import.col.full_name"),
      dataIndex: "fullName",
      render: (value: string | null) => value ?? <Text type="secondary">{DASH}</Text>,
    },
    {
      title: t("user.import.col.status"),
      dataIndex: "status",
      width: 130,
      render: (value: "VALID" | "INVALID") =>
        value === "VALID" ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            VALID
          </Tag>
        ) : (
          <Tag color="error" icon={<CloseCircleOutlined />}>
            INVALID
          </Tag>
        ),
    },
    {
      title: t("user.import.col.errors"),
      dataIndex: "errors",
      render: (errors: string[]) =>
        errors.length > 0 ? (
          <ul className="m-0 list-none space-y-1 p-0">
            {errors.map((message, index) => (
              <li key={`${message}-${index}`}>
                <Text type="danger" className="text-xs">
                  {message}
                </Text>
              </li>
            ))}
          </ul>
        ) : null,
    },
  ];

  const commitColumns = [
    {
      title: t("user.import.col.row"),
      dataIndex: "rowNumber",
      width: 70,
    },
    {
      title: t("user.import.col.email"),
      dataIndex: "email",
      render: (value: string | null) => value ?? <Text type="secondary">{DASH}</Text>,
    },
    {
      title: t("user.import.col.full_name"),
      dataIndex: "fullName",
      render: (value: string | null) => value ?? <Text type="secondary">{DASH}</Text>,
    },
    {
      title: t("user.import.col.status"),
      dataIndex: "status",
      width: 180,
      render: (value: "CREATED" | "FAILED_VALIDATION" | "FAILED_CREATE") => {
        if (value === "CREATED") {
          return (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              CREATED
            </Tag>
          );
        }
        return (
          <Tag color="error" icon={<CloseCircleOutlined />}>
            {value}
          </Tag>
        );
      },
    },
    {
      title: t("user.import.col.errors"),
      dataIndex: "errors",
      render: (errors: string[]) =>
        errors.length > 0 ? (
          <ul className="m-0 list-none space-y-1 p-0">
            {errors.map((message, index) => (
              <li key={`${message}-${index}`}>
                <Text type="danger" className="text-xs">
                  {message}
                </Text>
              </li>
            ))}
          </ul>
        ) : null,
    },
  ];

  const hasSelectedFile = fileList.length > 0;

  const footer = () => {
    if (step === "idle") {
      return (
        <Space>
          <Button onClick={() => handleClose()}>{t("global.cancel")}</Button>
          <Button type="primary" disabled={!hasSelectedFile} onClick={handleValidate}>
            {t("user.import.validate_btn")}
          </Button>
        </Space>
      );
    }

    if (step === "validating" || step === "committing") {
      return null;
    }

    if (step === "validated") {
      return (
        <Space>
          <Button onClick={reset}>Back</Button>
          <Button
            type="primary"
            disabled={!validateResult || validateResult.validRows === 0}
            onClick={handleCommit}>
            {t("user.import.commit_btn")}
            {validateResult && validateResult.validRows > 0 ? ` (${validateResult.validRows})` : ""}
          </Button>
        </Space>
      );
    }

    if (step === "done") {
      return (
        <Button type="primary" onClick={() => handleClose(true)}>
          Close
        </Button>
      );
    }

    return null;
  };

  return (
    <Modal
      open={open}
      title={t("user.import.excel.title")}
      onCancel={() => handleClose()}
      footer={footer()}
      width={860}
      destroyOnClose>
      {error ? (
        <Alert type="error" message={error} closable onClose={() => setError(null)} className="mb-4" />
      ) : null}

      {step === "idle" || step === "validating" ? (
        <Spin spinning={step === "validating"} tip={t("user.import.validating")}>
          <div className="mb-3 flex justify-end">
            <Button size="small" icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
              {t("user.import.download_template")}
            </Button>
          </div>

          <Dragger
            accept=".xlsx"
            maxCount={1}
            fileList={fileList}
            beforeUpload={(file) => {
              const isXlsx =
                file.type ===
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
                file.name.toLowerCase().endsWith(".xlsx");
              if (!isXlsx) {
                setError(t("user.import.upload_only_xlsx"));
                return Upload.LIST_IGNORE;
              }
              selectedFileRef.current = file;
              setFileList([
                {
                  uid: file.uid,
                  name: file.name,
                  status: "done",
                  size: file.size,
                },
              ]);
              return false;
            }}
            onRemove={() => {
              selectedFileRef.current = null;
              setFileList([]);
            }}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">{t("user.import.upload_hint")}</p>
            <p className="ant-upload-hint">{t("user.import.upload_only_xlsx")}</p>
          </Dragger>
        </Spin>
      ) : null}

      {step === "committing" ? (
        <div className="flex flex-col items-center gap-4 py-12">
          <Spin size="large" />
          <Text type="secondary">{t("user.import.committing")}</Text>
        </div>
      ) : null}

      {step === "validated" && validateResult ? (
        <>
          <Row gutter={16} className="mb-4">
            <Col span={8}>
              <Statistic title={t("user.import.total_rows")} value={validateResult.totalRows} />
            </Col>
            <Col span={8}>
              <Statistic
                title={t("user.import.valid_rows")}
                value={validateResult.validRows}
                valueStyle={{ color: "#3f8600" }}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title={t("user.import.invalid_rows")}
                value={validateResult.invalidRows}
                valueStyle={validateResult.invalidRows > 0 ? { color: "#cf1322" } : undefined}
                prefix={validateResult.invalidRows > 0 ? <CloseCircleOutlined /> : undefined}
              />
            </Col>
          </Row>

          {validateResult.invalidRows > 0 ? (
            <Alert
              type="warning"
              showIcon
              message={`${validateResult.invalidRows} row(s) have validation errors and will be skipped at commit.`}
              className="mb-3"
            />
          ) : null}

          <Table
            dataSource={validateResult.rows}
            columns={validateColumns}
            rowKey="rowNumber"
            size="small"
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: true }}
          />
        </>
      ) : null}

      {step === "done" && commitResult ? (
        <>
          <Row gutter={16} className="mb-4">
            <Col span={8}>
              <Statistic title={t("user.import.total_rows")} value={commitResult.totalRows} />
            </Col>
            <Col span={8}>
              <Statistic
                title={t("user.import.created_rows")}
                value={commitResult.createdRows}
                valueStyle={{ color: "#3f8600" }}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title={t("user.import.failed_rows")}
                value={commitResult.failedRows}
                valueStyle={commitResult.failedRows > 0 ? { color: "#cf1322" } : undefined}
                prefix={commitResult.failedRows > 0 ? <CloseCircleOutlined /> : undefined}
              />
            </Col>
          </Row>

          {commitResult.createdRows > 0 ? (
            <Alert
              type="success"
              showIcon
              message={`Successfully created ${commitResult.createdRows} user(s).`}
              className="mb-3"
            />
          ) : null}

          <Table
            dataSource={commitResult.rows}
            columns={commitColumns}
            rowKey="rowNumber"
            size="small"
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: true }}
          />
        </>
      ) : null}
    </Modal>
  );
}
