import { useCallback, useMemo, useRef, useState } from "react";
import type { DragEvent } from "react";
import {
  Button,
  Checkbox,
  Dropdown,
  Empty,
  Input,
  Select,
  Tooltip,
  Typography,
  Upload,
  message,
} from "antd";
import type { MenuProps, UploadProps } from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CheckSquareOutlined,
  DeleteOutlined,
  FileTextOutlined,
  FontSizeOutlined,
  HolderOutlined,
  MessageOutlined,
  MinusOutlined,
  PictureOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";

import { useLocale } from "@/i18n";

import type {
  DocumentBlock,
  DocumentBlockDoc,
  DocumentBlockType,
} from "./documentBlockEditor.utils";
import {
  createBlock,
  createChecklistItem,
  isBlockType,
  normalizeBlockDoc,
} from "./documentBlockEditor.utils";

interface DocumentBlockEditorProps {
  value: DocumentBlockDoc;
  readOnly?: boolean;
  onChange: (nextValue: DocumentBlockDoc) => void;
  onUploadImage?: (file: File) => Promise<{
    secureUrl: string;
    originalFilename?: string;
  }>;
}

type DropPosition = "before" | "after";

type DragState = {
  draggingId: string | null;
  overId: string | null;
  position: DropPosition | null;
};

const EMPTY_DRAG_STATE: DragState = {
  draggingId: null,
  overId: null,
  position: null,
};

const MAX_IMAGE_SIZE_MB = 5;

const getBlockIcon = (type: DocumentBlockType) => {
  if (type === "heading") return <FontSizeOutlined />;
  if (type === "paragraph") return <FileTextOutlined />;
  if (type === "checklist") return <CheckSquareOutlined />;
  if (type === "quote") return <MessageOutlined />;
  if (type === "image") return <PictureOutlined />;
  return <MinusOutlined />;
};

const reorderBlocks = (
  blocks: DocumentBlock[],
  draggingId: string,
  overId: string,
  position: DropPosition,
): DocumentBlock[] => {
  if (draggingId === overId) return blocks;

  const draggingIndex = blocks.findIndex((block) => block.id === draggingId);
  const overIndex = blocks.findIndex((block) => block.id === overId);

  if (draggingIndex < 0 || overIndex < 0) return blocks;

  const next = [...blocks];
  const [draggingBlock] = next.splice(draggingIndex, 1);

  const targetIndex = next.findIndex((block) => block.id === overId);
  if (targetIndex < 0) return blocks;

  const insertIndex = position === "before" ? targetIndex : targetIndex + 1;
  next.splice(insertIndex, 0, draggingBlock);

  return next;
};

const checklistToText = (block: DocumentBlock) => {
  return (block.items ?? [])
    .map((item) => item.text)
    .filter(Boolean)
    .join("\n");
};

function BlockTypeLabel({ type }: { type: DocumentBlockType }) {
  const { t } = useLocale();

  return (
    <span className="inline-flex items-center gap-2">
      {getBlockIcon(type)}
      {t(`document.block.type.${type}`)}
    </span>
  );
}

function DropIndicator({ position }: { position: DropPosition }) {
  return (
    <div
      className={[
        "pointer-events-none absolute left-12 right-3 z-20",
        position === "before" ? "-top-1" : "-bottom-1",
      ].join(" ")}
    >
      <div className="h-1 rounded-full bg-brand shadow-[0_0_0_3px_rgba(37,99,235,0.12)]" />
    </div>
  );
}

export default function DocumentBlockEditor({
  value,
  readOnly = false,
  onChange,
  onUploadImage,
}: DocumentBlockEditorProps) {
  const { t } = useLocale();

  const rafRef = useRef<number | null>(null);

  const [dragState, setDragState] = useState<DragState>(EMPTY_DRAG_STATE);
  const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null);

  const doc = useMemo(() => normalizeBlockDoc(value), [value]);
  const blocks = doc.content;

  const emit = useCallback(
    (content: DocumentBlock[]) => {
      onChange({
        type: "doc",
        content: content.length ? content : [createBlock("paragraph")],
      });
    },
    [onChange],
  );

  const updateBlock = useCallback(
    (id: string, patch: Partial<DocumentBlock>) => {
      emit(
        blocks.map((block) =>
          block.id === id
            ? {
                ...block,
                ...patch,
              }
            : block,
        ),
      );
    },
    [blocks, emit],
  );

  const changeBlockType = useCallback(
    (block: DocumentBlock, nextType: DocumentBlockType) => {
      if (nextType === block.type) return;

      if (nextType === "checklist") {
        updateBlock(block.id, {
          type: "checklist",
          text: undefined,
          checked: undefined,
          level: undefined,
          src: undefined,
          alt: undefined,
          items: block.items?.length
            ? block.items
            : (block.text ?? "")
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line) => createChecklistItem(line)),
        });

        return;
      }

      if (nextType === "heading") {
        updateBlock(block.id, {
          type: "heading",
          text:
            block.text ??
            checklistToText(block) ??
            block.alt ??
            block.src ??
            "",
          level: 1,
          checked: undefined,
          src: undefined,
          alt: undefined,
          items: undefined,
        });

        return;
      }

      if (nextType === "image") {
        updateBlock(block.id, {
          type: "image",
          text: undefined,
          checked: undefined,
          level: undefined,
          items: undefined,
          src: block.src ?? "",
          alt: block.alt ?? block.text ?? checklistToText(block) ?? "",
        });

        return;
      }

      if (nextType === "divider") {
        updateBlock(block.id, {
          type: "divider",
          text: undefined,
          checked: undefined,
          level: undefined,
          src: undefined,
          alt: undefined,
          items: undefined,
        });

        return;
      }

      updateBlock(block.id, {
        type: nextType,
        text:
          block.text ??
          checklistToText(block) ??
          block.alt ??
          block.src ??
          "",
        checked: undefined,
        level: undefined,
        src: undefined,
        alt: undefined,
        items: undefined,
      });
    },
    [updateBlock],
  );

  const addBlock = useCallback(
    (type: DocumentBlockType, afterId?: string) => {
      const nextBlock = createBlock(type);

      if (!afterId) {
        emit([...blocks, nextBlock]);
        return;
      }

      const index = blocks.findIndex((block) => block.id === afterId);

      if (index < 0) {
        emit([...blocks, nextBlock]);
        return;
      }

      emit([
        ...blocks.slice(0, index + 1),
        nextBlock,
        ...blocks.slice(index + 1),
      ]);
    },
    [blocks, emit],
  );

  const removeBlock = useCallback(
    (id: string) => {
      if (blocks.length <= 1) {
        emit([createBlock("paragraph")]);
        return;
      }

      emit(blocks.filter((block) => block.id !== id));
    },
    [blocks, emit],
  );

  const moveBlock = useCallback(
    (id: string, direction: "up" | "down") => {
      const index = blocks.findIndex((block) => block.id === id);
      if (index < 0) return;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= blocks.length) return;

      const next = [...blocks];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);

      emit(next);
    },
    [blocks, emit],
  );

  const updateChecklistItem = useCallback(
    (
      blockId: string,
      itemId: string,
      patch: Partial<{
        text: string;
        checked: boolean;
      }>,
    ) => {
      const block = blocks.find((item) => item.id === blockId);
      if (!block || block.type !== "checklist") return;

      const items = block.items?.length
        ? block.items
        : [createChecklistItem(block.text ?? "", Boolean(block.checked))];

      updateBlock(blockId, {
        text: undefined,
        checked: undefined,
        items: items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                ...patch,
              }
            : item,
        ),
      });
    },
    [blocks, updateBlock],
  );

  const addChecklistItem = useCallback(
    (blockId: string, afterItemId?: string) => {
      const block = blocks.find((item) => item.id === blockId);
      if (!block || block.type !== "checklist") return;

      const items = block.items?.length
        ? block.items
        : [createChecklistItem("", false)];

      const newItem = createChecklistItem();

      if (!afterItemId) {
        updateBlock(blockId, {
          text: undefined,
          checked: undefined,
          items: [...items, newItem],
        });

        return;
      }

      const index = items.findIndex((item) => item.id === afterItemId);

      if (index < 0) {
        updateBlock(blockId, {
          text: undefined,
          checked: undefined,
          items: [...items, newItem],
        });

        return;
      }

      updateBlock(blockId, {
        text: undefined,
        checked: undefined,
        items: [
          ...items.slice(0, index + 1),
          newItem,
          ...items.slice(index + 1),
        ],
      });
    },
    [blocks, updateBlock],
  );

  const removeChecklistItem = useCallback(
    (blockId: string, itemId: string) => {
      const block = blocks.find((item) => item.id === blockId);
      if (!block || block.type !== "checklist") return;

      const items = block.items?.length
        ? block.items
        : [createChecklistItem(block.text ?? "", Boolean(block.checked))];

      if (items.length <= 1) {
        updateBlock(blockId, {
          text: undefined,
          checked: undefined,
          items: [createChecklistItem()],
        });

        return;
      }

      updateBlock(blockId, {
        text: undefined,
        checked: undefined,
        items: items.filter((item) => item.id !== itemId),
      });
    },
    [blocks, updateBlock],
  );

  const validateImageFile = useCallback(
    (file: File) => {
      const isImage = file.type.startsWith("image/");
      const isLt5Mb = file.size / 1024 / 1024 < MAX_IMAGE_SIZE_MB;

      if (!isImage) {
        message.error(t("document.block.image.only_image"));
        return false;
      }

      if (!isLt5Mb) {
        message.error(t("document.block.image.max_size"));
        return false;
      }

      return true;
    },
    [t],
  );

  const handleUploadImage = useCallback(
    async (blockId: string, file: File) => {
      const valid = validateImageFile(file);
      if (!valid) return;

      if (!onUploadImage) {
        message.error(t("document.block.image.upload_not_configured"));
        return;
      }

      setUploadingBlockId(blockId);

      try {
        const result = await onUploadImage(file);

        updateBlock(blockId, {
          src: result.secureUrl,
          alt: result.originalFilename ?? file.name,
        });

        message.success(t("document.block.image.upload_success"));
      } catch (error: unknown) {
        message.error(
          error instanceof Error
            ? error.message
            : t("document.block.image.upload_error"),
        );
      } finally {
        setUploadingBlockId(null);
      }
    },
    [onUploadImage, t, updateBlock, validateImageFile],
  );

  const createUploadProps = useCallback(
    (blockId: string): UploadProps => ({
      accept: "image/*",
      showUploadList: false,
      beforeUpload: (file) => {
        const valid = validateImageFile(file);

        if (!valid) {
          return Upload.LIST_IGNORE;
        }

        void handleUploadImage(blockId, file);
        return false;
      },
    }),
    [handleUploadImage, validateImageFile],
  );

  const handleDragStart = useCallback(
    (event: DragEvent<HTMLButtonElement>, blockId: string) => {
      if (readOnly) return;

      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", blockId);

      const ghost = document.createElement("div");
      ghost.style.width = "1px";
      ghost.style.height = "1px";
      ghost.style.opacity = "0";
      ghost.style.position = "fixed";
      ghost.style.top = "-100px";
      ghost.style.left = "-100px";
      document.body.appendChild(ghost);

      event.dataTransfer.setDragImage(ghost, 0, 0);

      window.setTimeout(() => {
        if (ghost.parentNode) {
          document.body.removeChild(ghost);
        }
      }, 0);

      setDragState({
        draggingId: blockId,
        overId: null,
        position: null,
      });
    },
    [readOnly],
  );

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>, overId: string) => {
      if (readOnly) return;

      event.preventDefault();
      event.dataTransfer.dropEffect = "move";

      const rect = event.currentTarget.getBoundingClientRect();
      const offsetY = event.clientY - rect.top;
      const position: DropPosition =
        offsetY < rect.height / 2 ? "before" : "after";

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        setDragState((current) => {
          if (!current.draggingId) return current;

          if (current.overId === overId && current.position === position) {
            return current;
          }

          return {
            ...current,
            overId,
            position,
          };
        });
      });
    },
    [readOnly],
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>, overId: string) => {
      if (readOnly) return;

      event.preventDefault();

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      const draggingId =
        dragState.draggingId || event.dataTransfer.getData("text/plain");
      const position = dragState.position;

      if (!draggingId || !position) {
        setDragState(EMPTY_DRAG_STATE);
        return;
      }

      const next = reorderBlocks(blocks, draggingId, overId, position);

      emit(next);
      setDragState(EMPTY_DRAG_STATE);
    },
    [blocks, dragState.draggingId, dragState.position, emit, readOnly],
  );

  const handleDragEnd = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    setDragState(EMPTY_DRAG_STATE);
  }, []);

  const blockMenuItems = useMemo<MenuProps["items"]>(
    () => [
      {
        key: "heading",
        icon: <FontSizeOutlined />,
        label: t("document.block.type.heading"),
      },
      {
        key: "paragraph",
        icon: <FileTextOutlined />,
        label: t("document.block.type.paragraph"),
      },
      {
        key: "checklist",
        icon: <CheckSquareOutlined />,
        label: t("document.block.type.checklist"),
      },
      {
        key: "quote",
        icon: <MessageOutlined />,
        label: t("document.block.type.quote"),
      },
      {
        key: "image",
        icon: <PictureOutlined />,
        label: t("document.block.type.image"),
      },
      {
        type: "divider",
      },
      {
        key: "divider",
        icon: <MinusOutlined />,
        label: t("document.block.type.divider"),
      },
    ],
    [t],
  );

  if (!blocks.length) {
    return (
      <div className="rounded-2xl border border-dashed border-stroke bg-slate-50 py-12">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t("document.block.empty")}
        />

        {!readOnly && (
          <div className="mt-4 flex justify-center">
            <Dropdown
              trigger={["click"]}
              menu={{
                items: blockMenuItems,
                onClick: ({ key }) => {
                  if (isBlockType(key)) addBlock(key);
                },
              }}
            >
              <Button type="primary" icon={<PlusOutlined />}>
                {t("document.block.add")}
              </Button>
            </Dropdown>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="space-y-2"
      onDragEnd={handleDragEnd}
      onDragLeave={(event) => {
        const nextTarget = event.relatedTarget as Node | null;

        if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
          setDragState((current) => ({
            ...current,
            overId: null,
            position: null,
          }));
        }
      }}
    >
      {blocks.map((block, index) => {
        const isDragging = dragState.draggingId === block.id;
        const isDragOver = dragState.overId === block.id && !isDragging;

        return (
          <div
            key={block.id}
            className={[
              "relative rounded-2xl transition-[transform,opacity] duration-150",
              isDragging ? "scale-[0.985] opacity-35" : "opacity-100",
            ].join(" ")}
            onDragOver={(event) => handleDragOver(event, block.id)}
            onDrop={(event) => handleDrop(event, block.id)}
          >
            {isDragOver && dragState.position && (
              <DropIndicator position={dragState.position} />
            )}

            <div className="group rounded-2xl border border-transparent bg-white transition hover:border-brand/20 hover:bg-slate-50/60">
              <div className="flex gap-2 px-2 py-1.5">
                {!readOnly && (
                  <div className="flex w-10 shrink-0 flex-col items-center gap-1 pt-1 opacity-0 transition group-hover:opacity-100">
                    <Tooltip title={t("document.block.drag_hint")}>
                      <button
                        type="button"
                        draggable
                        onDragStart={(event) =>
                          handleDragStart(event, block.id)
                        }
                        className="flex h-7 w-7 cursor-grab items-center justify-center rounded-lg text-muted transition hover:bg-slate-100 active:cursor-grabbing"
                      >
                        <HolderOutlined />
                      </button>
                    </Tooltip>

                    <Dropdown
                      trigger={["click"]}
                      menu={{
                        items: blockMenuItems,
                        onClick: ({ key }) => {
                          if (isBlockType(key)) addBlock(key, block.id);
                        },
                      }}
                    >
                      <Button
                        size="small"
                        type="text"
                        icon={<PlusOutlined />}
                      />
                    </Dropdown>

                    <Button
                      size="small"
                      type="text"
                      icon={<ArrowUpOutlined />}
                      disabled={index === 0}
                      onClick={() => moveBlock(block.id, "up")}
                    />

                    <Button
                      size="small"
                      type="text"
                      icon={<ArrowDownOutlined />}
                      disabled={index === blocks.length - 1}
                      onClick={() => moveBlock(block.id, "down")}
                    />

                    <Button
                      size="small"
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeBlock(block.id)}
                    />
                  </div>
                )}

                <div className="min-w-0 flex-1 px-1 py-1">
                  {!readOnly && (
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <Select
                        size="small"
                        value={block.type}
                        className="w-40"
                        options={[
                          {
                            value: "heading",
                            label: <BlockTypeLabel type="heading" />,
                          },
                          {
                            value: "paragraph",
                            label: <BlockTypeLabel type="paragraph" />,
                          },
                          {
                            value: "checklist",
                            label: <BlockTypeLabel type="checklist" />,
                          },
                          {
                            value: "quote",
                            label: <BlockTypeLabel type="quote" />,
                          },
                          {
                            value: "image",
                            label: <BlockTypeLabel type="image" />,
                          },
                          {
                            value: "divider",
                            label: <BlockTypeLabel type="divider" />,
                          },
                        ]}
                        onChange={(nextType) => {
                          changeBlockType(block, nextType);
                        }}
                      />

                      {block.type === "heading" && (
                        <Select
                          size="small"
                          value={block.level ?? 1}
                          className="w-24"
                          options={[
                            { value: 1, label: "H1" },
                            { value: 2, label: "H2" },
                            { value: 3, label: "H3" },
                          ]}
                          onChange={(level) =>
                            updateBlock(block.id, {
                              level,
                            })
                          }
                        />
                      )}
                    </div>
                  )}

                  {block.type === "heading" && (
                    <Input.TextArea
                      autoSize
                      readOnly={readOnly}
                      value={block.text}
                      placeholder={t("document.block.placeholder.heading")}
                      onChange={(event) =>
                        updateBlock(block.id, {
                          text: event.target.value,
                        })
                      }
                      className={[
                        "border-0 bg-transparent px-0 shadow-none focus:shadow-none",
                        block.level === 1
                          ? "text-3xl font-bold"
                          : block.level === 2
                            ? "text-2xl font-bold"
                            : "text-xl font-semibold",
                      ].join(" ")}
                    />
                  )}

                  {block.type === "paragraph" && (
                    <Input.TextArea
                      autoSize={{ minRows: 1 }}
                      readOnly={readOnly}
                      value={block.text}
                      placeholder={t("document.block.placeholder.paragraph")}
                      onChange={(event) =>
                        updateBlock(block.id, {
                          text: event.target.value,
                        })
                      }
                      className="border-0 bg-transparent px-0 text-base leading-7 shadow-none focus:shadow-none"
                    />
                  )}

                  {block.type === "checklist" && (
                    <div className="space-y-2 py-1">
                      {(block.items?.length
                        ? block.items
                        : [
                            createChecklistItem(
                              block.text ?? "",
                              Boolean(block.checked),
                            ),
                          ]
                      ).map((item) => (
                        <div
                          key={item.id}
                          className="group/item flex items-start gap-3"
                        >
                          <Checkbox
                            checked={Boolean(item.checked)}
                            disabled={readOnly}
                            onChange={(event) =>
                              updateChecklistItem(block.id, item.id, {
                                checked: event.target.checked,
                              })
                            }
                            className="mt-1"
                          />

                          <Input.TextArea
                            autoSize
                            readOnly={readOnly}
                            value={item.text}
                            placeholder={t(
                              "document.block.placeholder.checklist",
                            )}
                            onChange={(event) =>
                              updateChecklistItem(block.id, item.id, {
                                text: event.target.value,
                              })
                            }
                            onKeyDown={(event) => {
                              if (readOnly) return;

                              if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault();
                                addChecklistItem(block.id, item.id);
                              }

                              if (
                                event.key === "Backspace" &&
                                !item.text &&
                                (block.items?.length ?? 0) > 1
                              ) {
                                event.preventDefault();
                                removeChecklistItem(block.id, item.id);
                              }
                            }}
                            className={[
                              "border-0 bg-transparent px-0 text-base leading-7 shadow-none focus:shadow-none",
                              item.checked ? "text-muted line-through" : "",
                            ].join(" ")}
                          />

                          {!readOnly && (
                            <Button
                              size="small"
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              className="opacity-0 transition group-hover/item:opacity-100"
                              onClick={() =>
                                removeChecklistItem(block.id, item.id)
                              }
                            />
                          )}
                        </div>
                      ))}

                      {!readOnly && (
                        <Button
                          size="small"
                          type="dashed"
                          icon={<PlusOutlined />}
                          onClick={() => addChecklistItem(block.id)}
                        >
                          {t("document.block.checklist.add_item")}
                        </Button>
                      )}
                    </div>
                  )}

                  {block.type === "quote" && (
                    <div className="border-l-4 border-brand/40 pl-4">
                      <Input.TextArea
                        autoSize
                        readOnly={readOnly}
                        value={block.text}
                        placeholder={t("document.block.placeholder.quote")}
                        onChange={(event) =>
                          updateBlock(block.id, {
                            text: event.target.value,
                          })
                        }
                        className="border-0 bg-transparent px-0 text-base italic leading-7 text-muted shadow-none focus:shadow-none"
                      />
                    </div>
                  )}

                  {block.type === "image" && (
                    <div className="space-y-3">
                      {!readOnly && (
                        <div className="grid gap-2 md:grid-cols-[1fr_180px]">
                          <Input
                            value={block.src}
                            placeholder={t(
                              "document.block.placeholder.image_url",
                            )}
                            onChange={(event) =>
                              updateBlock(block.id, {
                                src: event.target.value,
                              })
                            }
                          />

                          <Upload {...createUploadProps(block.id)}>
                            <Button
                              block
                              icon={<UploadOutlined />}
                              loading={uploadingBlockId === block.id}
                            >
                              {t("document.block.image.upload")}
                            </Button>
                          </Upload>
                        </div>
                      )}

                      {!readOnly && (
                        <Input
                          value={block.alt}
                          placeholder={t(
                            "document.block.placeholder.image_alt",
                          )}
                          onChange={(event) =>
                            updateBlock(block.id, {
                              alt: event.target.value,
                            })
                          }
                        />
                      )}

                      {block.src ? (
                        <figure className="overflow-hidden rounded-2xl border border-stroke bg-slate-50">
                          <img
                            src={block.src}
                            alt={block.alt || ""}
                            className="max-h-[420px] w-full object-contain"
                          />

                          {block.alt && (
                            <figcaption className="border-t border-stroke px-3 py-2 text-center text-xs text-muted">
                              {block.alt}
                            </figcaption>
                          )}
                        </figure>
                      ) : (
                        <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-stroke bg-slate-50 text-sm text-muted">
                          <PictureOutlined className="mr-2" />
                          {t("document.block.image.empty")}
                        </div>
                      )}
                    </div>
                  )}

                  {block.type === "divider" && (
                    <div className="py-4">
                      <div className="h-px w-full bg-stroke" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {!readOnly && (
        <div className="pt-2">
          <Dropdown
            trigger={["click"]}
            menu={{
              items: blockMenuItems,
              onClick: ({ key }) => {
                if (isBlockType(key)) addBlock(key);
              },
            }}
          >
            <Button type="dashed" icon={<PlusOutlined />}>
              {t("document.block.add")}
            </Button>
          </Dropdown>
        </div>
      )}

      {readOnly && blocks.length === 0 && (
        <Typography.Text type="secondary">
          {t("document.block.empty")}
        </Typography.Text>
      )}
    </div>
  );
}