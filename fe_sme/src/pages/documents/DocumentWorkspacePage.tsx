import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  Dropdown,
  Empty,
  Input,
  Modal,
  Tooltip,
  message,
} from "antd";
import type { MenuProps } from "antd";
import {
  FileAddOutlined,
  FolderAddOutlined,
  MoreOutlined,
  ReloadOutlined,
  SearchOutlined,
  SyncOutlined,
} from "@ant-design/icons";

import { useLocale } from "@/i18n";
import {
  apiDocCreateDraft,
  apiDocFolderAddDocument,
  apiDocFolderCreate,
  apiDocFolderDelete,
  apiDocFolderMove,
  apiDocFolderRename,
  apiDocFolderTreeWithDocuments,
} from "@/api/document/editor.api";
import type {
  DocFolderDocument,
  DocFolderNode,
} from "@/interface/document/editor";

import DocFolderTree from "./components/DocFolderTree";
import { useDocumentPermissions } from "./hooks/useDocumentPermissions";
import DocumentEditorPanel from "./editor/DocumentEditorPanel";

type FolderModalMode = "create-root" | "create-child" | "rename";

type FolderModalState = {
  open: boolean;
  mode: FolderModalMode;
  parentId?: string;
  folderId?: string;
  currentName?: string;
};

type NewDocModalState = {
  open: boolean;
  folderId?: string | null;
};

const safeChildren = (node: DocFolderNode): DocFolderNode[] =>
  node.children ?? [];

const safeDocuments = (node: DocFolderNode): DocFolderDocument[] =>
  node.documents ?? [];

const countEditorDocuments = (nodes: DocFolderNode[]): number => {
  return nodes.reduce((sum, node) => {
    const ownCount = safeDocuments(node).filter(
      (doc) => doc.contentKind !== "FILE",
    ).length;

    return sum + ownCount + countEditorDocuments(safeChildren(node));
  }, 0);
};

const findFolderName = (
  nodes: DocFolderNode[],
  folderId?: string | null,
): string | null => {
  if (!folderId) return null;

  for (const node of nodes) {
    if (node.folderId === folderId) return node.name;

    const found = findFolderName(safeChildren(node), folderId);
    if (found) return found;
  }

  return null;
};

const filterFolderTree = (
  nodes: DocFolderNode[],
  keyword: string,
): DocFolderNode[] => {
  const query = keyword.trim().toLowerCase();

  if (!query) return nodes;

  return nodes
    .map((node) => {
      const children = filterFolderTree(safeChildren(node), query);

      const documents = safeDocuments(node).filter((doc) => {
        const title = doc.title ?? "";
        return (
          doc.contentKind !== "FILE" && title.toLowerCase().includes(query)
        );
      });

      const folderMatched = node.name.toLowerCase().includes(query);

      if (folderMatched || children.length > 0 || documents.length > 0) {
        return {
          ...node,
          children,
          documents: folderMatched
            ? safeDocuments(node).filter((doc) => doc.contentKind !== "FILE")
            : documents,
        };
      }

      return null;
    })
    .filter(Boolean) as DocFolderNode[];
};

function FolderNameModal({
  open,
  title,
  initialValue,
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  initialValue?: string;
  loading: boolean;
  onConfirm: (name: string) => void;
  onClose: () => void;
}) {
  const { t } = useLocale();
  const [name, setName] = useState(initialValue ?? "");

  const submit = () => {
    if (!name.trim()) {
      message.warning(t("document.folder.name_placeholder"));
      return;
    }

    onConfirm(name.trim());
  };

  const close = () => {
    setName("");
    onClose();
  };

  return (
    <Modal
      title={title}
      open={open}
      onCancel={close}
      onOk={submit}
      afterOpenChange={(visible) => {
        if (visible) {
          setName(initialValue ?? "");
        }
      }}
      confirmLoading={loading}
      okText={t("document.common.save")}
      cancelText={t("document.common.cancel")}
    >
      <Input
        className="mt-4"
        placeholder={t("document.folder.name_placeholder")}
        value={name}
        onChange={(event) => setName(event.target.value)}
        onPressEnter={submit}
        autoFocus
      />
    </Modal>
  );
}

function NewWorkspaceDocModal({
  open,
  folderName,
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean;
  folderName?: string | null;
  loading: boolean;
  onConfirm: (title: string) => void;
  onClose: () => void;
}) {
  const { t } = useLocale();
  const [title, setTitle] = useState("");

  const submit = () => {
    if (!title.trim()) {
      message.warning(t("document.new_doc.placeholder"));
      return;
    }

    onConfirm(title.trim());
  };

  const close = () => {
    setTitle("");
    onClose();
  };

  return (
    <Modal
      title={t("document.workspace.new_doc")}
      open={open}
      onCancel={close}
      onOk={submit}
      afterOpenChange={(visible) => {
        if (visible) {
          setTitle("");
        }
      }}
      confirmLoading={loading}
      okText={t("document.new_doc.create")}
      cancelText={t("document.common.cancel")}
    >
      <div className="mt-4 space-y-3">
        <Input
          value={title}
          placeholder={t("document.new_doc.placeholder")}
          onChange={(event) => setTitle(event.target.value)}
          onPressEnter={submit}
          autoFocus
        />

        <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-muted">
          {folderName
            ? t("document.workspace.new_doc_folder_hint", {
                folder: folderName,
              })
            : t("document.workspace.new_doc_no_folder_hint")}
        </div>
      </div>
    </Modal>
  );
}

function WorkspaceEmptyState({
  canCreate,
  onCreateFolder,
}: {
  canCreate: boolean;
  onCreateFolder: () => void;
}) {
  const { t } = useLocale();

  return (
    <div className="flex h-full min-h-[520px] items-center justify-center bg-slate-50">
      <Card className="w-full max-w-md border border-stroke bg-white text-center shadow-sm">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div className="space-y-1">
              <p className="font-semibold text-ink">
                {t("document.workspace.empty_title")}
              </p>
              <p className="text-sm text-muted">
                {t("document.workspace.empty_desc")}
              </p>
            </div>
          }
        />

        {canCreate && (
          <Button
            type="primary"
            icon={<FolderAddOutlined />}
            onClick={onCreateFolder}
          >
            {t("document.folder.new")}
          </Button>
        )}
      </Card>
    </div>
  );
}

export default function DocumentWorkspacePage() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const permissions = useDocumentPermissions();

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null,
  );
  const [search, setSearch] = useState("");

  const [folderModal, setFolderModal] = useState<FolderModalState>({
    open: false,
    mode: "create-root",
  });

  const [newDocModal, setNewDocModal] = useState<NewDocModalState>({
    open: false,
    folderId: null,
  });

  const {
    data: tree,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["doc-folder-tree"],
    queryFn: apiDocFolderTreeWithDocuments,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const roots = tree?.roots ?? [];

  const filteredRoots = useMemo(
    () => filterFolderTree(roots, search),
    [roots, search],
  );

  const totalEditorDocs = useMemo(() => countEditorDocuments(roots), [roots]);

  const createFolderMutation = useMutation({
    mutationFn: ({ name, parentId }: { name: string; parentId?: string }) =>
      apiDocFolderCreate(name, parentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["doc-folder-tree"] });

      setFolderModal({
        open: false,
        mode: "create-root",
      });

      message.success(t("document.folder.create_success"));
    },
    onError: () => {
      message.error(t("document.folder.create_error"));
    },
  });

  const renameFolderMutation = useMutation({
    mutationFn: ({ folderId, name }: { folderId: string; name: string }) =>
      apiDocFolderRename(folderId, name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["doc-folder-tree"] });

      setFolderModal({
        open: false,
        mode: "create-root",
      });

      message.success(t("document.folder.rename_success"));
    },
    onError: () => {
      message.error(t("document.folder.rename_error"));
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (folderId: string) => apiDocFolderDelete(folderId),
    onSuccess: async (_, folderId) => {
      await queryClient.invalidateQueries({ queryKey: ["doc-folder-tree"] });

      if (selectedFolderId === folderId) {
        setSelectedFolderId(null);
      }

      message.success(t("document.folder.delete_success"));
    },
    onError: () => {
      message.error(t("document.folder.delete_error"));
    },
  });

  const createDocMutation = useMutation({
    mutationFn: async ({
      title,
      folderId,
    }: {
      title: string;
      folderId?: string | null;
    }) => {
      const res = await apiDocCreateDraft(title);

      if (folderId) {
        await apiDocFolderAddDocument(folderId, res.documentId);
      }

      return res;
    },
    onSuccess: async (res, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["doc-folder-tree"] });

      setNewDocModal({
        open: false,
        folderId: null,
      });

      setSelectedDocumentId(res.documentId);

      if (variables.folderId) {
        setSelectedFolderId(variables.folderId);
      }

      message.success(t("document.new_doc.create_success"));
    },
    onError: () => {
      message.error(t("document.new_doc.create_error"));
    },
  });

  const moveDocumentMutation = useMutation({
    mutationFn: async ({
      documentId,
      sourceFolderId,
      targetFolderId,
    }: {
      documentId: string;
      sourceFolderId: string;
      targetFolderId: string;
    }) => {
      if (sourceFolderId === targetFolderId) return;

      await apiDocFolderAddDocument(targetFolderId, documentId);
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["doc-folder-tree"] });

      setSelectedFolderId(variables.targetFolderId);
      setSelectedDocumentId(variables.documentId);

      message.success(t("document.folder.move_document_success"));
    },
    onError: () => {
      message.error(t("document.folder.move_document_error"));
    },
  });

  const moveFolderMutation = useMutation({
    mutationFn: ({
      sourceFolderId,
      targetParentFolderId,
    }: {
      sourceFolderId: string;
      targetParentFolderId: string | null;
    }) => apiDocFolderMove(sourceFolderId, targetParentFolderId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["doc-folder-tree"] });

      message.success(t("document.folder.move_folder_success"));
    },
    onError: () => {
      message.error(t("document.folder.move_folder_error"));
    },
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["doc-folder-tree"] });

    if (selectedDocumentId) {
      queryClient.invalidateQueries({
        queryKey: ["doc-detail", selectedDocumentId],
      });
    }
  }, [queryClient, selectedDocumentId]);

  const handleDeleteFolder = useCallback(
    (folderId: string) => {
      Modal.confirm({
        title: t("document.folder.delete"),
        content: t("document.folder.delete_confirm"),
        okText: t("document.folder.delete"),
        cancelText: t("document.common.cancel"),
        okButtonProps: { danger: true },
        onOk: () => deleteFolderMutation.mutate(folderId),
      });
    },
    [deleteFolderMutation, t],
  );

  const handleSelectFolder = useCallback((folderId: string | null) => {
    setSelectedFolderId(folderId);
  }, []);

  const handleSelectDocument = useCallback((documentId: string) => {
    setSelectedDocumentId(documentId);
  }, []);

  const handleMoveDocument = useCallback(
    (documentId: string, sourceFolderId: string, targetFolderId: string) => {
      moveDocumentMutation.mutate({
        documentId,
        sourceFolderId,
        targetFolderId,
      });
    },
    [moveDocumentMutation],
  );

  const handleMoveFolder = useCallback(
    (sourceFolderId: string, targetParentFolderId: string | null) => {
      if (sourceFolderId === targetParentFolderId) return;

      moveFolderMutation.mutate({
        sourceFolderId,
        targetParentFolderId,
      });
    },
    [moveFolderMutation],
  );

  const sidebarMenuItems: MenuProps["items"] = [
    {
      key: "new-folder",
      icon: <FolderAddOutlined />,
      label: t("document.folder.new"),
    },
    {
      key: "new-doc",
      icon: <FileAddOutlined />,
      label: t("document.workspace.new_doc"),
    },
  ];

  const handleSidebarMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "new-folder") {
      setFolderModal({
        open: true,
        mode: "create-root",
      });
      return;
    }

    if (key === "new-doc") {
      setNewDocModal({
        open: true,
        folderId: selectedFolderId,
      });
    }
  };

  const canManageWorkspace = permissions.canCreate || permissions.canEdit;

  const folderModalTitle =
    folderModal.mode === "rename"
      ? t("document.folder.rename")
      : folderModal.mode === "create-child"
        ? t("document.folder.new_sub")
        : t("document.folder.new");

  const folderModalInitialValue =
    folderModal.mode === "rename" ? folderModal.currentName : "";

  const folderModalLoading =
    folderModal.mode === "rename"
      ? renameFolderMutation.isPending
      : createFolderMutation.isPending;

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50">
      <div className="flex items-center gap-3 border-b border-stroke bg-white px-5 py-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="truncate text-lg font-bold text-ink">
            {t("document.workspace.page_title")}
          </h1>

          <p className="truncate text-xs text-muted">
            {t("document.workspace.page_subtitle", {
              count: String(totalEditorDocs),
            })}
          </p>
        </div>

        {isFetching && !isLoading && (
          <SyncOutlined spin className="text-sm text-brand" />
        )}

        <Tooltip title={t("document.action.refresh")}>
          <Button icon={<ReloadOutlined />} onClick={refresh} />
        </Tooltip>

        {canManageWorkspace && (
          <>
            <Button
              icon={<FolderAddOutlined />}
              onClick={() =>
                setFolderModal({
                  open: true,
                  mode: "create-root",
                })
              }
            >
              {t("document.folder.new")}
            </Button>

            <Button
              type="primary"
              icon={<FileAddOutlined />}
              onClick={() =>
                setNewDocModal({
                  open: true,
                  folderId: selectedFolderId,
                })
              }
            >
              {t("document.workspace.new_doc")}
            </Button>
          </>
        )}
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="flex w-80 shrink-0 flex-col border-r border-stroke bg-white">
          <div className="border-b border-stroke px-3 py-3">
            <div className="flex items-center gap-2">
              <Input
                allowClear
                size="small"
                prefix={<SearchOutlined className="text-muted" />}
                placeholder={t("document.workspace.search_placeholder")}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              {canManageWorkspace && (
                <Dropdown
                  trigger={["click"]}
                  menu={{
                    items: sidebarMenuItems,
                    onClick: handleSidebarMenuClick,
                  }}
                >
                  <Button size="small" icon={<MoreOutlined />} />
                </Dropdown>
              )}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            {roots.length === 0 && !isLoading ? (
              <WorkspaceEmptyState
                canCreate={canManageWorkspace}
                onCreateFolder={() =>
                  setFolderModal({
                    open: true,
                    mode: "create-root",
                  })
                }
              />
            ) : (
              <DocFolderTree
                roots={filteredRoots}
                loading={isLoading}
                selectedId={selectedFolderId}
                selectedDocumentId={selectedDocumentId}
                totalCount={totalEditorDocs}
                onSelect={handleSelectFolder}
                onSelectDocument={handleSelectDocument}
                canManage={canManageWorkspace}
                onCreateRoot={() =>
                  setFolderModal({
                    open: true,
                    mode: "create-root",
                  })
                }
                onCreateChild={(parentId) =>
                  setFolderModal({
                    open: true,
                    mode: "create-child",
                    parentId,
                  })
                }
                onRename={(folderId, currentName) =>
                  setFolderModal({
                    open: true,
                    mode: "rename",
                    folderId,
                    currentName,
                  })
                }
                onDelete={handleDeleteFolder}
                onMoveDocument={handleMoveDocument}
                onMoveFolder={handleMoveFolder}
                showAllDocuments={false}
              />
            )}
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-hidden">
          <DocumentEditorPanel
            documentId={selectedDocumentId}
            onPublished={() => {
              queryClient.invalidateQueries({ queryKey: ["doc-folder-tree"] });
            }}
            onTitleChange={() => {
              queryClient.invalidateQueries({ queryKey: ["doc-folder-tree"] });
            }}
          />
        </main>
      </div>

      <FolderNameModal
        open={folderModal.open}
        title={folderModalTitle}
        initialValue={folderModalInitialValue}
        loading={folderModalLoading}
        onConfirm={(name) => {
          if (folderModal.mode === "rename" && folderModal.folderId) {
            renameFolderMutation.mutate({
              folderId: folderModal.folderId,
              name,
            });
            return;
          }

          createFolderMutation.mutate({
            name,
            parentId:
              folderModal.mode === "create-child"
                ? folderModal.parentId
                : undefined,
          });
        }}
        onClose={() =>
          setFolderModal({
            open: false,
            mode: "create-root",
          })
        }
      />

      <NewWorkspaceDocModal
        open={newDocModal.open}
        folderName={findFolderName(roots, newDocModal.folderId)}
        loading={createDocMutation.isPending}
        onConfirm={(title) =>
          createDocMutation.mutate({
            title,
            folderId: newDocModal.folderId,
          })
        }
        onClose={() =>
          setNewDocModal({
            open: false,
            folderId: null,
          })
        }
      />
    </div>
  );
}
