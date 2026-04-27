import { useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Drawer,
  Empty,
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  apiDocReadList,
  apiDocLinkList,
  apiDocLinkAdd,
  apiDocLinkRemove,
  apiDocAssignmentList,
  apiDocAssignmentAssign,
  apiDocAssignmentUnassign,
  apiDocAttachmentList,
  apiDocAttachmentRemove,
  apiDocList,
} from "@/api/document/editor.api";
import { apiUploadDocumentAttachment } from "@/api/document/document.api";
import DocAccessRulesPanel from "../components/DocAccessRulesPanel";
import { useLocale } from "@/i18n";
import { useUserNameMap } from "@/utils/resolvers/userResolver";
import type {
  DocReadListItem,
  DocLinkItem,
  DocAssignmentItem,
  DocAttachmentItem,
} from "@/interface/document/editor";

// ── Read list tab ──────────────────────────────────────────────────────���───────

function ReadsTab({ documentId }: { documentId: string }) {
  const { t } = useLocale();
  const { data, isLoading } = useQuery({
    queryKey: ["doc-reads", documentId],
    queryFn: () => apiDocReadList(documentId),
    staleTime: 60_000,
  });
  const items: DocReadListItem[] = data?.items ?? [];

  if (isLoading) return <Skeleton active paragraph={{ rows: 5 }} />;
  if (!items.length)
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={t("document.reads.empty")}
      />
    );

  return (
    <div className="space-y-2">
      {items.map((r) => (
        <div
          key={r.userId}
          className="flex items-center justify-between gap-2 rounded-xl border border-stroke bg-white px-3 py-2">
          <div className="flex items-center gap-2">
            <Avatar size={28} className="bg-brand text-xs">
              {(r.fullName ?? r.email)?.[0]?.toUpperCase() ?? "?"}
            </Avatar>
            <div>
              <div className="text-sm font-medium text-ink">
                {r.fullName || r.email}
              </div>
              {r.readAt && (
                <div className="text-xs text-muted">
                  {dayjs(r.readAt).format("DD/MM/YYYY HH:mm")}
                </div>
              )}
            </div>
          </div>
          {r.status === "ACK" ? (
            <Tag color="green" className="m-0 text-xs">
              ACK
            </Tag>
          ) : (
            <Tag color="blue" className="m-0 text-xs">
              READ
            </Tag>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Links tab ──────────────────────────────────────────────────────────────────

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
    staleTime: 30_000,
  });

  const { data: docList } = useQuery({
    queryKey: ["doc-list", {}],
    queryFn: () => apiDocList(),
    staleTime: 60_000,
    enabled: adding,
  });

  const addMutation = useMutation({
    mutationFn: (tid: string) => apiDocLinkAdd(documentId, tid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doc-links", documentId] });
      setAdding(false);
      setTargetId(undefined);
      message.success(t("document.links.added"));
    },
    onError: () => message.error(t("document.links.add_error")),
  });

  const removeMutation = useMutation({
    mutationFn: (linkId: string) => apiDocLinkRemove(linkId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["doc-links", documentId] }),
    onError: () => message.error(t("document.links.remove_error")),
  });

  const items: DocLinkItem[] = data?.items ?? [];
  const outLinks = items.filter((l) => l.direction === "OUT");
  const inLinks = items.filter((l) => l.direction === "IN");

  if (isLoading) return <Skeleton active paragraph={{ rows: 4 }} />;

  const docOptions = (docList?.items ?? [])
    .filter((d) => d.documentId !== documentId)
    .map((d) => ({ label: d.title, value: d.documentId }));

  return (
    <div className="space-y-4">
      {canEdit && (
        <div>
          {adding ? (
            <div className="flex items-center gap-2">
              <Select
                showSearch
                placeholder={t("document.links.search_placeholder")}
                options={docOptions}
                value={targetId}
                onChange={setTargetId}
                filterOption={(input, opt) =>
                  (opt?.label as string)
                    ?.toLowerCase()
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
                {t("document.batch.cancel")}
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
            {outLinks.map((l) => (
              <div
                key={l.documentLinkId}
                className="flex items-center justify-between gap-2 rounded-xl border border-stroke bg-white px-3 py-2">
                <div className="flex items-center gap-2">
                  <LinkOutlined className="text-brand" />
                  <span className="text-sm text-ink">
                    {l.linkedDocumentId.slice(0, 8)}…
                  </span>
                  <Tag className="m-0 text-xs">{l.linkType}</Tag>
                </div>
                {canEdit && (
                  <Popconfirm
                    title={t("document.links.remove_confirm")}
                    onConfirm={() => removeMutation.mutate(l.documentLinkId)}
                    okText={t("document.access.remove_rule")}
                    okButtonProps={{ danger: true }}>
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
            {inLinks.map((l) => (
              <div
                key={l.documentLinkId}
                className="flex items-center gap-2 rounded-xl border border-stroke bg-white px-3 py-2">
                <LinkOutlined className="rotate-180 text-violet-500" />
                <span className="text-sm text-ink">
                  {l.linkedDocumentId.slice(0, 8)}…
                </span>
                <Tag className="m-0 text-xs">{l.linkType}</Tag>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Assignments tab ────────────────────────────────────────────────────────────

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
  const [assigneeId, setAssigneeId] = useState<string | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ["doc-assignments", documentId],
    queryFn: () => apiDocAssignmentList(documentId),
    staleTime: 30_000,
  });

  const assignMutation = useMutation({
    mutationFn: (uid: string) => apiDocAssignmentAssign(documentId, uid),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["doc-assignments", documentId],
      });
      setAdding(false);
      setAssigneeId(undefined);
      message.success(t("document.assignments.assigned"));
    },
    onError: () => message.error(t("document.assignments.assign_error")),
  });

  const unassignMutation = useMutation({
    mutationFn: (aid: string) => apiDocAssignmentUnassign(aid),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["doc-assignments", documentId],
      }),
    onError: () => message.error(t("document.assignments.unassign_error")),
  });

  const items: DocAssignmentItem[] = data?.items ?? [];

  if (isLoading) return <Skeleton active paragraph={{ rows: 4 }} />;

  return (
    <div className="space-y-4">
      {canManage && (
        <div>
          {adding ? (
            <div className="flex items-center gap-2">
              <Select
                showSearch
                placeholder={t("document.assignments.search_placeholder")}
                value={assigneeId}
                onChange={setAssigneeId}
                className="flex-1"
                size="small"
              />
              <Button
                size="small"
                type="primary"
                disabled={!assigneeId}
                loading={assignMutation.isPending}
                onClick={() =>
                  assigneeId && assignMutation.mutate(assigneeId)
                }>
                {t("document.assignments.assign")}
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setAdding(false);
                  setAssigneeId(undefined);
                }}>
                {t("document.batch.cancel")}
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
          {items.map((a) => (
            <div
              key={a.documentAssignmentId}
              className="flex items-center justify-between gap-2 rounded-xl border border-stroke bg-white px-3 py-2">
              <div className="flex items-center gap-2">
                <Avatar size={28} className="bg-violet-500 text-xs">
                  {resolveName(a.assigneeUserId, "?")?.[0]?.toUpperCase() ?? "?"}
                </Avatar>
                <div>
                  <div className="text-sm font-medium text-ink">
                    {resolveName(a.assigneeUserId)}
                  </div>
                  <div className="text-xs text-muted">
                    {dayjs(a.assignedAt).format("DD/MM/YYYY")}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Tag className="m-0 text-xs">{a.status}</Tag>
                {canManage && (
                  <Popconfirm
                    title={t("document.assignments.unassign_confirm")}
                    onConfirm={() =>
                      unassignMutation.mutate(a.documentAssignmentId)
                    }
                    okText={t("document.access.remove_rule")}
                    okButtonProps={{ danger: true }}>
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
          ))}
        </div>
      )}
    </div>
  );
}

// ── Attachments tab ────────────────────────────────────────────────────────────

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
    staleTime: 30_000,
  });

  const removeMutation = useMutation({
    mutationFn: (aid: string) => apiDocAttachmentRemove(aid),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["doc-attachments", documentId],
      }),
    onError: () => message.error(t("document.attachments.remove_error")),
  });

  const handleUpload = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("fileName", file.name);
    setUploading(true);
    try {
      await apiUploadDocumentAttachment(documentId, fd);
      message.success(t("document.attachments.upload_success"));
      queryClient.invalidateQueries({ queryKey: ["doc-attachments", documentId] });
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : t("document.attachments.upload_error"));
    } finally {
      setUploading(false);
    }
  };

  const items: DocAttachmentItem[] = data?.items ?? [];

  if (isLoading) return <Skeleton active paragraph={{ rows: 4 }} />;

  return (
    <div className="space-y-3">
      {canUpload && (
        <Upload
          beforeUpload={(file) => { void handleUpload(file); return false; }}
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
          {items.map((a) => (
            <div
              key={a.documentAttachmentId}
              className="flex items-center justify-between gap-2 rounded-xl border border-stroke bg-white px-3 py-2">
              <div className="flex items-center gap-2">
                <PaperClipOutlined className="text-muted" />
                <div>
                  <a
                    href={a.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-brand hover:underline">
                    {a.fileName}
                  </a>
                  <div className="text-xs text-muted">
                    {a.fileType} ·{" "}
                    {(a.fileSizeBytes / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>
              {canEdit && (
                <Popconfirm
                  title={t("document.attachments.remove_confirm")}
                  onConfirm={() =>
                    removeMutation.mutate(a.documentAttachmentId)
                  }
                  okText={t("document.access.remove_rule")}
                  okButtonProps={{ danger: true }}>
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

// ── Main Drawer ────────────────────────────────────────────────────────────────

interface DocumentInfoDrawerProps {
  documentId: string;
  open: boolean;
  onClose: () => void;
  canViewStats: boolean;
  canEdit: boolean;
  canPublish: boolean;
  canManageAccessRules: boolean;
  /** HR / MANAGER — can upload new attachments */
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
  canUpload = false,
}: DocumentInfoDrawerProps) {
  const { t } = useLocale();

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
        <AssignmentsTab documentId={documentId} canManage={canPublish} />
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
        <AttachmentsTab documentId={documentId} canEdit={canEdit} canUpload={canUpload} />
      ) : null,
    },
    ...(canManageAccessRules
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
      width={420}
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
