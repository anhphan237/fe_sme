import { useState, useRef } from "react";
import {
  Modal,
  Upload,
  Button,
  Table,
  Tag,
  Space,
  Alert,
  Statistic,
  Row,
  Col,
  Spin,
  Typography,
} from "antd";
import {
  InboxOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import {
  apiDownloadBulkImportTemplate,
  apiValidateBulkImportExcel,
  apiCommitBulkImportExcel,
} from "@/api/identity/identity.api";
import type {
  BulkUserImportValidateResponse,
  BulkUserImportCommitResponse,
} from "@/interface/identity";
import { useLocale } from "@/i18n";

const { Dragger } = Upload;
const { Text } = Typography;

type Step = "idle" | "validating" | "validated" | "committing" | "done";

interface Props {
  open: boolean;
  onClose: (refetch?: boolean) => void;
}

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
      const a = document.createElement("a");
      a.href = url;
      a.download = "user_import_template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to download template.");
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
      setError(err instanceof Error ? err.message : "Validation failed");
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
      setError(err instanceof Error ? err.message : "Import failed");
      setStep("validated");
    }
  };

  // ── Validate result columns ────────────────────────────
  const validateColumns = [
    {
      title: t("user.import.col.row"),
      dataIndex: "rowNumber",
      width: 60,
    },
    {
      title: t("user.import.col.email"),
      dataIndex: "email",
      render: (v: string | null) => v ?? <Text type="secondary">—</Text>,
    },
    {
      title: t("user.import.col.full_name"),
      dataIndex: "fullName",
      render: (v: string | null) => v ?? <Text type="secondary">—</Text>,
    },
    {
      title: t("user.import.col.status"),
      dataIndex: "status",
      width: 100,
      render: (v: string) =>
        v === "VALID" ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            {v}
          </Tag>
        ) : (
          <Tag color="error" icon={<CloseCircleOutlined />}>
            {v}
          </Tag>
        ),
    },
    {
      title: t("user.import.col.errors"),
      dataIndex: "errors",
      render: (errs: string[]) =>
        errs.length ? (
          <ul className="list-none m-0 p-0 space-y-1">
            {errs.map((e, i) => (
              <li key={i}>
                <Text type="danger" className="text-xs">
                  {e}
                </Text>
              </li>
            ))}
          </ul>
        ) : null,
    },
  ];

  // ── Commit result columns ───────────────────────────────
  const commitColumns = [
    {
      title: t("user.import.col.row"),
      dataIndex: "rowNumber",
      width: 60,
    },
    {
      title: t("user.import.col.email"),
      dataIndex: "email",
      render: (v: string | null) => v ?? <Text type="secondary">—</Text>,
    },
    {
      title: t("user.import.col.full_name"),
      dataIndex: "fullName",
      render: (v: string | null) => v ?? <Text type="secondary">—</Text>,
    },
    {
      title: t("user.import.col.status"),
      dataIndex: "status",
      width: 130,
      render: (v: string) => {
        if (v === "CREATED")
          return (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              {v}
            </Tag>
          );
        return (
          <Tag color="error" icon={<CloseCircleOutlined />}>
            {v}
          </Tag>
        );
      },
    },
    {
      title: t("user.import.col.errors"),
      dataIndex: "errors",
      render: (errs: string[]) =>
        errs.length ? (
          <ul className="list-none m-0 p-0 space-y-1">
            {errs.map((e, i) => (
              <li key={i}>
                <Text type="danger" className="text-xs">
                  {e}
                </Text>
              </li>
            ))}
          </ul>
        ) : null,
    },
  ];

  // ── Footer buttons ─────────────────────────────────────
  const footer = () => {
    if (step === "idle") {
      return (
        <Space>
          <Button onClick={() => handleClose()}>Cancel</Button>
          <Button
            type="primary"
            disabled={!selectedFileRef.current}
            onClick={handleValidate}>
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
            {validateResult && validateResult.validRows > 0
              ? ` (${validateResult.validRows})`
              : ""}
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
      width={780}
      destroyOnClose>
      {/* Global error */}
      {error && (
        <Alert
          type="error"
          message={error}
          closable
          onClose={() => setError(null)}
          className="mb-4"
        />
      )}

      {/* ── STEP: idle ─────────────────────────────────── */}
      {(step === "idle" || step === "validating") && (
        <Spin
          spinning={step === "validating"}
          tip={t("user.import.validating")}>
          <div className="mb-3 flex justify-end">
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={handleDownloadTemplate}>
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
                file.name.endsWith(".xlsx");
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
              return false; // prevent auto-upload
            }}
            onRemove={() => {
              selectedFileRef.current = null;
              setFileList([]);
            }}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">{t("user.import.upload_hint")}</p>
            <p className="ant-upload-hint">
              {t("user.import.upload_only_xlsx")}
            </p>
          </Dragger>
        </Spin>
      )}

      {/* ── STEP: committing ─────────────────────────── */}
      {step === "committing" && (
        <div className="flex flex-col items-center py-12 gap-4">
          <Spin size="large" />
          <Text type="secondary">{t("user.import.committing")}</Text>
        </div>
      )}

      {/* ── STEP: validated ──────────────────────────── */}
      {step === "validated" && validateResult && (
        <>
          <Row gutter={16} className="mb-4">
            <Col span={8}>
              <Statistic
                title={t("user.import.total_rows")}
                value={validateResult.totalRows}
              />
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
                valueStyle={
                  validateResult.invalidRows > 0
                    ? { color: "#cf1322" }
                    : undefined
                }
                prefix={
                  validateResult.invalidRows > 0 ? (
                    <CloseCircleOutlined />
                  ) : undefined
                }
              />
            </Col>
          </Row>

          {validateResult.invalidRows > 0 && (
            <Alert
              type="warning"
              showIcon
              message={`${validateResult.invalidRows} row(s) have errors and will be skipped during import.`}
              className="mb-3"
            />
          )}

          <Table
            dataSource={validateResult.rows}
            columns={validateColumns}
            rowKey="rowNumber"
            size="small"
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: true }}
          />
        </>
      )}

      {/* ── STEP: done ────────────────────────────────── */}
      {step === "done" && commitResult && (
        <>
          <Row gutter={16} className="mb-4">
            <Col span={8}>
              <Statistic
                title={t("user.import.total_rows")}
                value={commitResult.totalRows}
              />
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
                valueStyle={
                  commitResult.failedRows > 0 ? { color: "#cf1322" } : undefined
                }
                prefix={
                  commitResult.failedRows > 0 ? (
                    <CloseCircleOutlined />
                  ) : undefined
                }
              />
            </Col>
          </Row>

          {commitResult.createdRows > 0 && (
            <Alert
              type="success"
              showIcon
              message={`Successfully created ${commitResult.createdRows} user(s).`}
              className="mb-3"
            />
          )}

          <Table
            dataSource={commitResult.rows}
            columns={commitColumns}
            rowKey="rowNumber"
            size="small"
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: true }}
          />
        </>
      )}
    </Modal>
  );
}
