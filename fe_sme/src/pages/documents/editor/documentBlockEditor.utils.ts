export type DocumentBlockType =
  | "heading"
  | "paragraph"
  | "checklist"
  | "quote"
  | "image"
  | "divider";

export interface DocumentChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface DocumentBlock {
  id: string;
  type: DocumentBlockType;
  text?: string;
  checked?: boolean;
  level?: 1 | 2 | 3;
  src?: string;
  alt?: string;
  items?: DocumentChecklistItem[];
}

export interface DocumentBlockDoc {
  type: "doc";
  content: DocumentBlock[];
}

export const createBlockId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const createChecklistItem = (
  text = "",
  checked = false,
): DocumentChecklistItem => ({
  id: createBlockId(),
  text,
  checked,
});

export const createBlock = (type: DocumentBlockType): DocumentBlock => {
  if (type === "heading") {
    return {
      id: createBlockId(),
      type,
      text: "",
      level: 1,
    };
  }

  if (type === "checklist") {
    return {
      id: createBlockId(),
      type,
      items: [createChecklistItem()],
    };
  }

  if (type === "image") {
    return {
      id: createBlockId(),
      type,
      src: "",
      alt: "",
    };
  }

  return {
    id: createBlockId(),
    type,
    text: "",
  };
};

export const emptyBlockDoc = (): DocumentBlockDoc => ({
  type: "doc",
  content: [createBlock("paragraph")],
});

export const isBlockType = (value: unknown): value is DocumentBlockType => {
  return (
    value === "heading" ||
    value === "paragraph" ||
    value === "checklist" ||
    value === "quote" ||
    value === "image" ||
    value === "divider"
  );
};

const normalizeLevel = (value: unknown): 1 | 2 | 3 => {
  return value === 2 || value === 3 ? value : 1;
};

const extractTiptapText = (node: unknown): string => {
  if (!node || typeof node !== "object") return "";

  const record = node as Record<string, unknown>;

  if (record.type === "text" && typeof record.text === "string") {
    return record.text;
  }

  const content = Array.isArray(record.content) ? record.content : [];

  return content.map(extractTiptapText).join("");
};

const normalizeChecklistItems = (
  rawItems: unknown,
  fallbackText?: string,
  fallbackChecked?: boolean,
): DocumentChecklistItem[] => {
  if (Array.isArray(rawItems)) {
    const items = rawItems
      .map((rawItem): DocumentChecklistItem | null => {
        if (!rawItem || typeof rawItem !== "object") return null;

        const record = rawItem as Record<string, unknown>;

        return {
          id:
            typeof record.id === "string" && record.id
              ? record.id
              : createBlockId(),
          text: typeof record.text === "string" ? record.text : "",
          checked:
            typeof record.checked === "boolean" ? record.checked : false,
        };
      })
      .filter(Boolean) as DocumentChecklistItem[];

    if (items.length) return items;
  }

  if (fallbackText?.trim()) {
    const items = fallbackText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => createChecklistItem(line, Boolean(fallbackChecked)));

    if (items.length) return items;
  }

  return [createChecklistItem()];
};

const tiptapNodeToBlock = (node: unknown): DocumentBlock | null => {
  if (!node || typeof node !== "object") return null;

  const record = node as Record<string, unknown>;
  const type = record.type;

  if (type === "heading") {
    const attrs =
      record.attrs && typeof record.attrs === "object"
        ? (record.attrs as Record<string, unknown>)
        : {};

    return {
      id: createBlockId(),
      type: "heading",
      level: normalizeLevel(attrs.level),
      text: extractTiptapText(record),
    };
  }

  if (type === "paragraph") {
    return {
      id: createBlockId(),
      type: "paragraph",
      text: extractTiptapText(record),
    };
  }

  if (type === "blockquote") {
    return {
      id: createBlockId(),
      type: "quote",
      text: extractTiptapText(record),
    };
  }

  if (type === "horizontalRule") {
    return {
      id: createBlockId(),
      type: "divider",
    };
  }

  if (type === "image") {
    const attrs =
      record.attrs && typeof record.attrs === "object"
        ? (record.attrs as Record<string, unknown>)
        : {};

    return {
      id: createBlockId(),
      type: "image",
      src: typeof attrs.src === "string" ? attrs.src : "",
      alt: typeof attrs.alt === "string" ? attrs.alt : "",
    };
  }

  if (type === "taskList") {
    const content = Array.isArray(record.content) ? record.content : [];

    const items = content
      .map((taskItem): DocumentChecklistItem | null => {
        if (!taskItem || typeof taskItem !== "object") return null;

        const taskRecord = taskItem as Record<string, unknown>;
        const attrs =
          taskRecord.attrs && typeof taskRecord.attrs === "object"
            ? (taskRecord.attrs as Record<string, unknown>)
            : {};

        return createChecklistItem(
          extractTiptapText(taskRecord),
          Boolean(attrs.checked),
        );
      })
      .filter(Boolean) as DocumentChecklistItem[];

    return {
      id: createBlockId(),
      type: "checklist",
      items: items.length ? items : [createChecklistItem()],
    };
  }

  const text = extractTiptapText(record);

  return {
    id: createBlockId(),
    type: "paragraph",
    text,
  };
};

export const normalizeBlockDoc = (value: unknown): DocumentBlockDoc => {
  if (!value) return emptyBlockDoc();

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return normalizeBlockDoc(parsed);
    } catch {
      const content = value
        .split("\n")
        .map(
          (line): DocumentBlock => ({
            id: createBlockId(),
            type: "paragraph",
            text: line,
          }),
        )
        .filter((block) => block.text?.trim());

      return {
        type: "doc",
        content: content.length ? content : emptyBlockDoc().content,
      };
    }
  }

  if (typeof value !== "object") return emptyBlockDoc();

  const record = value as Record<string, unknown>;

  if (record.type === "doc" && Array.isArray(record.content)) {
    const content = record.content
      .map((item): DocumentBlock | null => {
        if (!item || typeof item !== "object") return null;

        const itemRecord = item as Record<string, unknown>;

        if (isBlockType(itemRecord.type)) {
          const blockType = itemRecord.type;

          if (blockType === "checklist") {
            return {
              id:
                typeof itemRecord.id === "string" && itemRecord.id
                  ? itemRecord.id
                  : createBlockId(),
              type: "checklist",
              items: normalizeChecklistItems(
                itemRecord.items,
                typeof itemRecord.text === "string" ? itemRecord.text : "",
                typeof itemRecord.checked === "boolean"
                  ? itemRecord.checked
                  : false,
              ),
            };
          }

          if (blockType === "heading") {
            return {
              id:
                typeof itemRecord.id === "string" && itemRecord.id
                  ? itemRecord.id
                  : createBlockId(),
              type: "heading",
              text:
                typeof itemRecord.text === "string" ? itemRecord.text : "",
              level: normalizeLevel(itemRecord.level),
            };
          }

          if (blockType === "image") {
            return {
              id:
                typeof itemRecord.id === "string" && itemRecord.id
                  ? itemRecord.id
                  : createBlockId(),
              type: "image",
              src: typeof itemRecord.src === "string" ? itemRecord.src : "",
              alt: typeof itemRecord.alt === "string" ? itemRecord.alt : "",
            };
          }

          if (blockType === "divider") {
            return {
              id:
                typeof itemRecord.id === "string" && itemRecord.id
                  ? itemRecord.id
                  : createBlockId(),
              type: "divider",
            };
          }

          return {
            id:
              typeof itemRecord.id === "string" && itemRecord.id
                ? itemRecord.id
                : createBlockId(),
            type: blockType,
            text: typeof itemRecord.text === "string" ? itemRecord.text : "",
          };
        }

        return tiptapNodeToBlock(itemRecord);
      })
      .filter(Boolean) as DocumentBlock[];

    return {
      type: "doc",
      content: content.length ? content : emptyBlockDoc().content,
    };
  }

  return emptyBlockDoc();
};

export const blockDocToPlainText = (doc: DocumentBlockDoc): string => {
  return doc.content
    .map((block) => {
      if (block.type === "divider") return "";

      if (block.type === "image") {
        return block.alt || block.src || "";
      }

      if (block.type === "checklist") {
        return (block.items ?? [])
          .map((item) => item.text)
          .filter(Boolean)
          .join("\n");
      }

      return block.text ?? "";
    })
    .join("\n")
    .trim();
};