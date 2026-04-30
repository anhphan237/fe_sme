import { useState } from "react";
import {
  Avatar,
  Button,
  Drawer,
  Empty,
  Input,
  Popconfirm,
  Select,
  Skeleton,
  Tabs,
  Tag,
  Upload,
  message,
} from "antd";
import {
  DeleteOutlined,
  EyeOutlined,
  LinkOutlined,
  PaperClipOutlined,
  PlusOutlined,
  SafetyOutlined,
  TeamOutlined,
  UploadOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiDocAssignmentAssign,
  apiDocAssignmentList,
  apiDocAssignmentUnassign,
  apiDocAttachmentList,
  apiDocAttachmentRemove,
  apiDocLinkAdd,
  apiDocLinkList,
  apiDocLinkRemove,
  apiDocList,
  apiDocReadList,
} from "@/api/document/editor.api";
import { apiUploadDocumentAttachment } from "@/api/document/document.api";
import DocAccessRulesPanel from "../components/DocAccessRulesPanel";
import { useLocale } from "@/i18n";
import { useUserNameMap } from "@/utils/resolvers/userResolver";
import type {
  DocAssignmentItem,
  DocAttachmentItem,
  DocLinkItem,
  DocReadListItem,
} from "@/interface/document/editor";

function ReadsTab({ documentId }: { documentId: string }) {
  const { t } = useLocale();

  const { data, isLoading } = useQuery({
    queryKey: ["doc-reads", documentId],
    queryFn: () => apiDocReadList(documentId),
    enabled: Boolean(documentId),
    staleTime: 60_000,
  });

  const items: DocReadListItem[] = data?.items ?? [];

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 5 }} />;
  }

  if (!items.length) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={t("document.reads.empty")}
      />
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const name = item.fullName || item.email || item.userId;
        const isAck = item.status === "ACK";

        return (
          <div
            key={item.userId}
            className="flex items-center justify-between gap-2 rounded-xl border border-stroke bg-white px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <Avatar size={28} className="shrink-0 bg-brand text-xs">
                {name?.[0]?.toUpperCase() ?? "?"}
              </Avatar>

              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-ink">
                  {name}
                </div>

                {item.readAt && (
                  <div className="text-xs text-muted">
                    {t("document.reads.read_at")}:{" "}
                    {dayjs(item.readAt).format("DD/MM/YYYY HH:mm")}
                  </div>
                )}

                {item.acknowledgedAt && (
                  <div className="text-xs text-muted">
                    {t("document.reads.ack_at")}:{" "}
                    {dayjs(item.acknowledgedAt).format("DD/MM/YYYY HH:mm")}
                  </div>
                )}
              </div>
            </div>

            <Tag color={isAck ? "green" : "blue"} className="m-0 text-xs">
              {isAck ? t("document.reads.ack") : t("document.reads.read")}
            </Tag>
          </div>
        );
      })}
    </div>
  );
}

function LinksTab({
  documentId,
  canEdit,
}: {
  documentId: string;
  canEdit: boolean;
}) {
  const { t } = useLocale();
  const queryClient = useQueryClient();

  const [adding, setAdding] = useState(false);
  const [targetId, setTargetId] = useState<string | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ["doc-links", documentId],
    queryFn: () => apiDocLinkList(documentId),
    enabled: Boolean(documentId),
    staleTime: 30_000,
  });

  const { data: docList, isLoading: isLoadingDocs } = useQuery({
    queryKey: ["doc-list", "for-links"],
    queryFn: () => apiDocList(),
    enabled: adding,
    staleTime: 60_000,
  });

  const addMutation = useMutation({
    mutationFn: (targetDocumentId: string) =>
      apiDocLinkAdd(documentId, targetDocumentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doc-links", documentId] });
      setAdding(false);
      setTargetId(undefined);
      message.success(t("document.links.added"));
    },
    onError: () => {
      message.error(t("document.links.add_error"));
    },
  });

  const removeMutation = useMutation({
    mutationFn: (documentLinkId: string) =>
      apiDocLinkRemove(documentLinkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doc-links", documentId] });
      message.success(t("document.links.removed"));
    },
    onError: () => {
      message.error(t("document.links.remove_error"));
    },
  });

  const items: DocLinkItem[] = data?.items ?? [];
  const outLinks = items.filter((item) => item.direction === "OUT");
  const inLinks = items.filter((item) => item.direction === "IN");

  const docOptions =
    docList?.items
      ?.filter((item) => item.documentId !== documentId)
      .map((item) => ({
        label: item.title || item.documentId,
        value: item.documentId,
      })) ?? [];

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <div>
          {adding ? (
            <div className="flex items-center gap-2">
              <Select
                showSearch
                loading={isLoadingDocs}
                placeholder={t("document.links.search_placeholder")}
                options={docOptions}
                value={targetId}
                onChange={setTargetId}
                filterOption={(input, option) =>
                  String(option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                className="flex-1"
                size="small"
              />

              <Button
                size="small"
                type="primary"
                disabled={!targetId}
                loading={addMutation.isPending}
                onClick={() => targetId && addMutation.mutate(targetId)}>
                {t("document.links.add")}
              </Button>

              <Button
                size="small"
                onClick={() => {
                  setAdding(false);
                  setTargetId(undefined);
                }}>
                {t("document.common.cancel")}
              </Button>
            </div>
          ) : (
            <Button
              size="small"
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => setAdding(true)}>
              {t("document.links.add")}
            </Button>
          )}
        </div>
      )}

      {outLinks.length === 0 && inLinks.length === 0 && (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t("document.links.empty")}
        />
      )}

      {outLinks.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            {t("document.links.outgoing")}
          </p>

          <div className="space-y-1.5">
            {outLinks.map((item) => (
              <div
                key={item.documentLinkId}
                className="flex items-center justify-between gap-2 rounded-xl border border-stroke bg-white px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <LinkOutlined className="shrink-0 text-brand" />

                  <span className="truncate text-sm text-ink">
                    {item.linkedDocumentTitle ||
                      `${item.linkedDocumentId.slice(0, 8)}…`}
                  </span>

                  {item.linkType && (
                    <Tag className="m-0 shrink-0 text-xs">
                      {item.linkType}
                    </Tag>
                  )}
                </div>

                {canEdit && (
                  <Popconfirm
                    title={t("document.links.remove_confirm")}
                    okText={t("document.common.remove")}
                    cancelText={t("document.common.cancel")}
                    okButtonProps={{ danger: true }}
                    onConfirm={() =>
                      removeMutation.mutate(item.documentLinkId)
                    }>
                    <Button
                      size="small"
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      loading={removeMutation.isPending}
                    />
                  </Popconfirm>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {inLinks.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            {t("document.links.incoming")}
          </p>

          <div className="space-y-1.5">
            {inLinks.map((item) => (
              <div
                key={item.documentLinkId}
                className="flex items-center gap-2 rounded-xl border border-stroke bg-white px-3 py-2">
                <LinkOutlined className="rotate-180 text-violet-500" />

                <span className="truncate text-sm text-ink">
                  {item.linkedDocumentTitle ||
                    `${item.linkedDocumentId.slice(0, 8)}…`}
                </span>

                {item.linkType && (
                  <Tag className="m-0 shrink-0 text-xs">
                    {item.linkType}
                  </Tag>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AssignmentsTab({
  documentId,
  canManage,
}: {
  documentId: string;
  canManage: boolean;
}) {
  const { t } = useLocale();
  const { resolveName } = useUserNameMap();
  const queryClient = useQueryClient();

  const [adding, setAdding] = useState(false);
  const [assigneeId, setAssigneeId] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["doc-assignments", documentId],
    queryFn: () => apiDocAssignmentList(documentId),
    enabled: Boolean(documentId),
    staleTime: 30_000,
  });

  const assignMutation = useMutation({
    mutationFn: (assigneeUserId: string) =>
      apiDocAssignmentAssign(documentId, assigneeUserId.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["doc-assignments", documentId],
      });
      setAdding(false);
      setAssigneeId("");
      message.success(t("document.assignments.assigned"));
    },
    onError: () => {
      message.error(t("document.assignments.assign_error"));
    },
  });

  const unassignMutation = useMutation({
    mutationFn: (documentAssignmentId: string) =>
      apiDocAssignmentUnassign(documentAssignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["doc-assignments", documentId],
      });
      message.success(t("document.assignments.unassigned"));
    },
    onError: () => {
      message.error(t("document.assignments.unassign_error"));
    },
  });

  const items: DocAssignmentItem[] = data?.items ?? [];

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div>
          {adding ? (
            <div className="flex items-center gap-2">
              <Input
                size="small"
                value={assigneeId}
                placeholder={t("document.assignments.user_id_placeholder")}
                onChange={(event) => setAssigneeId(event.target.value)}
                onPressEnter={() => {
                  if (assigneeId.trim()) {
                    assignMutation.mutate(assigneeId);
                  }
                }}
                className="flex-1"
              />

              <Button
                size="small"
                type="primary"
                disabled={!assigneeId.trim()}
                loading={assignMutation.isPending}
                onClick={() => assignMutation.mutate(assigneeId)}>
                {t("document.assignments.assign")}
              </Button>

              <Button
                size="small"
                onClick={() => {
                  setAdding(false);
                  setAssigneeId("");
                }}>
                {t("document.common.cancel")}
              </Button>
            </div>
          ) : (
            <Button
              size="small"
              type="dashed"
              icon={<UserAddOutlined />}
              onClick={() => setAdding(true)}>
              {t("document.assignments.assign")}
            </Button>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t("document.assignments.empty")}
        />
      ) : (
        <div className="space-y-1.5">
          {items.map((item) => {
            const displayName =
              item.assigneeFullName ||
              item.assigneeEmail ||
              resolveName(item.assigneeUserId) ||
              item.assigneeUserId;

            return (
              <div
                key={item.documentAssignmentId}
                className="flex items-center justify-between gap-2 rounded-xl border border-stroke bg-white px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar size={28} className="shrink-0 bg-violet-500 text-xs">
                    {displayName?.[0]?.toUpperCase() ?? "?"}
                  </Avatar>

                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink">
                      {displayName}
                    </div>

                    {item.assignedAt && (
                      <div className="text-xs text-muted">
                        {dayjs(item.assignedAt).format("DD/MM/YYYY HH:mm")}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.status && (
                    <Tag className="m-0 text-xs">{item.status}</Tag>
                  )}

                  {canManage && (
                    <Popconfirm
                      title={t("document.assignments.unassign_confirm")}
                      okText={t("document.common.remove")}
                      cancelText={t("document.common.cancel")}
                      okButtonProps={{ danger: true }}
                      onConfirm={() =>
                        unassignMutation.mutate(item.documentAssignmentId)
                      }>
                      <Button
                        size="small"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        loading={unassignMutation.isPending}
                      />
                    </Popconfirm>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AttachmentsTab({
  documentId,
  canEdit,
  canUpload,
}: {
  documentId: string;
  canEdit: boolean;
  canUpload: boolean;
}) {
  const { t } = useLocale();
  const queryClient = useQueryClient();

  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["doc-attachments", documentId],
    queryFn: () => apiDocAttachmentList(documentId),
    enabled: Boolean(documentId),
    staleTime: 30_000,
  });

  const removeMutation = useMutation({
    mutationFn: (documentAttachmentId: string) =>
      apiDocAttachmentRemove(documentAttachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["doc-attachments", documentId],
      });
      message.success(t("document.attachments.removed"));
    },
    onError: () => {
      message.error(t("document.attachments.remove_error"));
    },
  });

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileName", file.name);

    setUploading(true);

    try {
      await apiUploadDocumentAttachment(documentId, formData);
      message.success(t("document.attachments.upload_success"));

      queryClient.invalidateQueries({
        queryKey: ["doc-attachments", documentId],
      });
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : t("document.attachments.upload_error"),
      );
    } finally {
      setUploading(false);
    }
  };

  const items: DocAttachmentItem[] = data?.items ?? [];

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  return (
    <div className="space-y-3">
      {canUpload && (
        <Upload
          beforeUpload={(file) => {
            void handleUpload(file);
            return false;
          }}
          showUploadList={false}
          disabled={uploading}>
          <Button
            size="small"
            type="dashed"
            icon={<UploadOutlined />}
            loading={uploading}>
            {t("document.attachments.upload")}
          </Button>
        </Upload>
      )}

      {items.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t("document.attachments.empty")}
        />
      ) : (
        <div className="space-y-1.5">
          {items.map((item) => (
            <div
              key={item.documentAttachmentId}
              className="flex items-center justify-between gap-2 rounded-xl border border-stroke bg-white px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <PaperClipOutlined className="shrink-0 text-muted" />

                <div className="min-w-0">
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-sm font-medium text-brand hover:underline">
                    {item.fileName}
                  </a>

                  <div className="text-xs text-muted">
                    {item.fileType || t("document.attachments.file")} ·{" "}
                    {typeof item.fileSizeBytes === "number"
                      ? `${(item.fileSizeBytes / 1024).toFixed(1)} KB`
                      : t("document.attachments.unknown_size")}
                  </div>
                </div>
              </div>

              {canEdit && (
                <Popconfirm
                  title={t("document.attachments.remove_confirm")}
                  okText={t("document.common.remove")}
                  cancelText={t("document.common.cancel")}
                  okButtonProps={{ danger: true }}
                  onConfirm={() =>
                    removeMutation.mutate(item.documentAttachmentId)
                  }>
                  <Button
                    size="small"
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    loading={removeMutation.isPending}
                  />
                </Popconfirm>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface DocumentInfoDrawerProps {
  documentId: string;
  open: boolean;
  onClose: () => void;

  canViewStats: boolean;
  canEdit: boolean;
  canPublish: boolean;
  canManageAccessRules: boolean;

  /** Optional: manager can view but not edit access rules later */
  canViewAccessRules?: boolean;

  /** HR / Manager can upload attachments */
  canUpload?: boolean;
}

export default function DocumentInfoDrawer({
  documentId,
  open,
  onClose,
  canViewStats,
  canEdit,
  canPublish,
  canManageAccessRules,
  canViewAccessRules,
  canUpload = false,
}: DocumentInfoDrawerProps) {
  const { t } = useLocale();

  const shouldShowAccessTab =
    Boolean(canViewAccessRules) || Boolean(canManageAccessRules);

  const tabs = [
    ...(canViewStats
      ? [
          {
            key: "reads",
            label: (
              <span className="flex items-center gap-1">
                <EyeOutlined />
                {t("document.drawer.tab.reads")}
              </span>
            ),
            children: open ? <ReadsTab documentId={documentId} /> : null,
          },
        ]
      : []),

    {
      key: "links",
      label: (
        <span className="flex items-center gap-1">
          <LinkOutlined />
          {t("document.drawer.tab.links")}
        </span>
      ),
      children: open ? (
        <LinksTab documentId={documentId} canEdit={canEdit} />
      ) : null,
    },

    {
      key: "assignments",
      label: (
        <span className="flex items-center gap-1">
          <TeamOutlined />
          {t("document.drawer.tab.assignments")}
        </span>
      ),
      children: open ? (
        <AssignmentsTab
          documentId={documentId}
          canManage={canEdit || canPublish}
        />
      ) : null,
    },

    {
      key: "attachments",
      label: (
        <span className="flex items-center gap-1">
          <PaperClipOutlined />
          {t("document.drawer.tab.attachments")}
        </span>
      ),
      children: open ? (
        <AttachmentsTab
          documentId={documentId}
          canEdit={canEdit}
          canUpload={canUpload}
        />
      ) : null,
    },

    ...(shouldShowAccessTab
      ? [
          {
            key: "access",
            label: (
              <span className="flex items-center gap-1">
                <SafetyOutlined />
                {t("document.drawer.tab.access")}
              </span>
            ),
            children: open ? (
              <DocAccessRulesPanel
                documentId={documentId}
                canManage={canManageAccessRules}
              />
            ) : null,
          },
        ]
      : []),
  ];

  return (
    <Drawer
      title={
        <span className="flex items-center gap-2 text-sm font-semibold">
          {t("document.drawer.title")}
        </span>
      }
      open={open}
      onClose={onClose}
      width={520}
      styles={{ body: { padding: "0 16px 16px" } }}>
      <Tabs
        items={tabs}
        size="small"
        tabBarStyle={{ marginBottom: 12 }}
        defaultActiveKey={canViewStats ? "reads" : "links"}
      />
    </Drawer>
  );
}