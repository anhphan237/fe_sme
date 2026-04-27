# Document Page — API Sync & Expansion Plan

> **Codebase**: React 18 + TypeScript + Ant Design 6 + TanStack Query 5 + Zustand
> **Ngày lập**: 2026-04-25
> **Phạm vi**: [src/pages/documents/](../src/pages/documents/) + [src/api/document/](../src/api/document/) + [src/interface/document/](../src/interface/document/)
> **Tài liệu liên quan**: [document-page-development-plan.md](./document-page-development-plan.md)

Tài liệu này đối chiếu **toàn bộ** operation `com.sme.document.*` và `com.sme.content.document.*` ở backend (`be_sme/src/main/java/com/sme/be_sme/modules/content/facade/`) với trạng thái sử dụng hiện tại của FE, vạch rõ:

1. Những op đã có nhưng FE chưa dùng → mở rộng tính năng.
2. Những op FE đang gọi nhưng **không tồn tại** ở BE → fix gấp.
3. Những type FE đang khai báo **lệch shape** so với response BE → fix gấp (gây bug runtime, hiển thị sai).
4. Roadmap mở rộng pages theo các năng lực mới (Links / Assignments / Attachments / Read List).

---

## 1. Bản đồ Operation đầy đủ (BE → FE)

### 1.1 ContentFacade — `com.sme.content.document.*`

| Operation | FE wrapper | Trạng thái |
|---|---|---|
| `com.sme.content.document.upload` | `apiSaveDocument` (deprecated) + `POST /api/v1/documents/upload` | ⚠️ FE upload bằng REST endpoint riêng — vẫn ổn, nhưng `apiSaveDocument` nên xóa. |
| `com.sme.content.document.list` | `apiGetDocuments(documentCategoryId?)` | ✅ |
| `com.sme.content.document.acknowledge` | `apiAcknowledgeDocument(documentId, onboardingId?)` | ✅ |

### 1.2 DocumentEditorFacade — `com.sme.document.*`

| Operation | FE wrapper | Trạng thái |
|---|---|---|
| `com.sme.document.createDraft` | `apiDocCreateDraft(title)` | ✅ |
| `com.sme.document.updateDraft` | `apiDocUpdateDraft(id, title, content)` | ✅ |
| `com.sme.document.autosave` | `apiDocAutosave(id, title, content)` | ✅ |
| `com.sme.document.publish` | `apiDocPublish(id)` | ✅ (response không khớp type — xem §3) |
| `com.sme.document.detail` | `apiDocDetail(id)` | ⚠️ Thiếu params `activityLimit / readLimit / commentLimit / include / relationLimit` |
| `com.sme.document.list` | `apiDocList(params)` | ⚠️ Type `DocEditorListItem` chứa field thừa (`createdBy`, `folderPlacement`) |
| `com.sme.document.version.list` | `apiDocVersionList(id)` | ❌ Type lệch (xem §3) |
| `com.sme.document.version.get` | `apiDocVersionGet(versionId)` | ❌ Type lệch |
| `com.sme.document.version.compare` | `apiDocVersionCompare(v1, v2)` | ❌ Type lệch |
| `com.sme.document.read.mark` | `apiDocMarkRead(id)` | ✅ |
| `com.sme.document.read.list` | **chưa có** | 🆕 Cần bổ sung — phục vụ panel "Người đã đọc" |
| `com.sme.document.folder.create` | `apiDocFolderCreate(name, parentFolderId?)` | ✅ |
| `com.sme.document.folder.rename` | `apiDocFolderRename(id, name)` | ✅ |
| `com.sme.document.folder.move` | `apiDocFolderMove(id, newParentFolderId?)` | ✅ |
| `com.sme.document.folder.list` | `apiDocFolderList()` | ⚠️ Wrapper `DocFolderListResponse` field tên `folders` nhưng BE trả `items` |
| `com.sme.document.folder.tree` | **chưa có** | 🆕 Cần để mở folder picker khi move document mà không cần payload nặng |
| `com.sme.document.folder.treeWithDocuments` | `apiDocFolderTreeWithDocuments()` | ✅ |
| `com.sme.document.folder.delete` | `apiDocFolderDelete(id)` | ✅ |
| `com.sme.document.folder.addDocument` | `apiDocFolderAddDocument(folderId, documentId)` | ✅ |
| `com.sme.document.folder.removeDocument` | `apiDocFolderRemoveDocument(folderId, documentId)` | ✅ |
| `com.sme.document.comment.add` | `apiDocCommentAdd(id, body, parentCommentId?)` | ⚠️ Response trả `{ commentId, documentId, parentCommentId, createdAt }` — FE đang typed `unknown`, cần khai báo |
| `com.sme.document.comment.list` | **chưa có** | 🆕 Bổ sung (flat list, dùng cho audit/admin view) |
| `com.sme.document.comment.tree` | `apiDocCommentTree(id)` | ✅ |
| `com.sme.document.comment.delete` | `apiDocCommentDelete(id)` | ✅ |
| `com.sme.document.comment.update` | `apiDocCommentUpdate(id, body)` | ✅ |
| `com.sme.document.accessRule.add` | `apiDocAccessRuleAdd(documentId, { roleId?, departmentId? })` | ✅ |
| `com.sme.document.accessRule.remove` | `apiDocAccessRuleRemove(ruleId)` | ⚠️ BE expects `{ documentAccessRuleId }` — kiểm tra payload key |
| `com.sme.document.accessRule.list` | **chưa có** | 🆕 Hiện đang phải gọi `apiDocDetail` để lấy rules |
| `com.sme.document.link.add` | **chưa có** | 🆕 Tính năng liên kết tài liệu chéo |
| `com.sme.document.link.remove` | **chưa có** | 🆕 |
| `com.sme.document.link.list` | **chưa có** | 🆕 |
| `com.sme.document.assignment.assign` | **chưa có** | 🆕 Giao tài liệu cho user (thay/đi kèm với assignment qua onboarding) |
| `com.sme.document.assignment.unassign` | **chưa có** | 🆕 |
| `com.sme.document.assignment.list` | **chưa có** | 🆕 |
| `com.sme.document.attachment.add` | **chưa có** | 🆕 Đính kèm file/video bổ sung cho EDITOR doc |
| `com.sme.document.attachment.remove` | **chưa có** | 🆕 |
| `com.sme.document.attachment.list` | **chưa có** | 🆕 |

### 1.3 Operation FE đang gọi nhưng BE KHÔNG có

| FE call | Nơi dùng | Hành động |
|---|---|---|
| `com.sme.document.acknowledgment.list` | [document.api.ts:91](../src/api/document/document.api.ts#L91), [Documents.tsx:454](../src/pages/documents/Documents.tsx#L454), [DocumentDetail.tsx:167](../src/pages/documents/DocumentDetail.tsx#L167) | ❌ **BE không định nghĩa op này.** Gateway sẽ trả lỗi. Phải refactor FE — xem §2.1 |

---

## 2. Bug "ngầm" hiện tại — fix trước khi mở rộng

### 2.1 `apiListAcknowledgments()` không tồn tại trên BE

**Hiện trạng**: `apiListAcknowledgments` gọi `com.sme.document.acknowledgment.list` nhưng BE không expose op này. Tuy nhiên trên thực tế UI vẫn render được vì TanStack Query nuốt lỗi và để mảng trống → user không bao giờ thấy badge "Đã xác nhận" hoặc danh sách "Cần xác nhận".

**Hai phương án:**

| Phương án | Ưu | Nhược |
|---|---|---|
| **A. Thêm op `com.sme.document.acknowledgment.list` trên BE** trả `[{ documentAcknowledgementId, documentId, onboardingId, taskMarkedDone }]` của user hiện tại | UI giữ nguyên | Cần thay đổi BE |
| **B. Bỏ `apiListAcknowledgments`, thay bằng filter từ `apiDocDetail.reads[]`** (theo userId hiện tại với `status === 'ACK'` / `ackedAt != null`) | Không sửa BE | Phải gọi detail từng doc → không scale cho list view |

**Khuyến nghị**: Phương án **A** — thêm 1 op nhỏ ở BE. Đây là dữ liệu cá nhân, query đơn giản (`SELECT * FROM document_acknowledgement WHERE user_id = ?`). Trong lúc chờ BE, FE giữ wrapper nhưng catch lỗi mềm và disable tab "Cần xác nhận" nếu rỗng.

### 2.2 Type lệch shape — gây hiển thị sai/null

Các interface FE đang dùng tên field **không khớp** BE response. Trong nhiều trường hợp FE đọc `item.versionNumber` trong khi BE trả `versionNo` → undefined ở UI mà không lỗi compile.

#### 2.2.1 `DocVersionItem`
Sửa tại [src/interface/document/editor.ts:140](../src/interface/document/editor.ts#L140):
```typescript
// HIỆN TẠI (sai)
export interface DocVersionItem {
  versionId: string;
  documentId: string;
  versionNumber: number;
  publishedAt: string;
  publishedBy: string;
  note?: string;
}
export interface DocVersionListResponse { versions: DocVersionItem[]; }

// SỬA THÀNH (khớp BE)
export interface DocVersionItem {
  documentVersionId: string;
  versionNo: number;
  fileUrl: string | null;
  richTextSnapshot: boolean;
  uploadedAt: string;
  uploadedBy: string;
}
export interface DocVersionListResponse {
  documentId: string;
  items: DocVersionItem[];
}
```

#### 2.2.2 `DocVersionDetail`
```typescript
// SỬA THÀNH
export interface DocVersionDetail {
  documentVersionId: string;
  documentId: string;
  versionNo: number;
  fileUrl: string | null;
  contentJson: unknown;          // BE: JsonNode contentJson
  uploadedAt: string;
  uploadedBy: string;
}
```

#### 2.2.3 `DocVersionCompareResponse`
```typescript
// SỬA THÀNH
export interface DocVersionCompareResponse {
  documentId: string;
  equal: boolean;
  fromDocumentVersionId: string;
  toDocumentVersionId: string;
  fromVersionNo: number;
  toVersionNo: number;
  summary: {
    topLevelKeysAdded?: string[];
    topLevelKeysRemoved?: string[];
    changedPaths?: string[];
  } | null;
}
```

#### 2.2.4 `DocReadItem`
```typescript
// SỬA THÀNH
export interface DocReadItem {
  userId: string;
  status: "READ" | "ACK" | string;
  readAt: string | null;
  ackedAt: string | null;
}
```
→ Logic "Đã xác nhận" của EMPLOYEE phải đổi thành: `reads.find(r => r.userId === me)?.status === "ACK"` thay vì chỉ check tồn tại.

#### 2.2.5 `DocLinkItem` — toàn bộ field sai
```typescript
// SỬA THÀNH
export interface DocLinkItem {
  documentLinkId: string;
  linkedDocumentId: string;
  linkType: string;              // "RELATED" | "SEE_ALSO" | string
  direction: "OUT" | "IN";
  createdAt: string;
  createdBy: string;
}
```

#### 2.2.6 `DocAssignmentItem`
```typescript
// SỬA THÀNH
export interface DocAssignmentItem {
  documentAssignmentId: string;
  assigneeUserId: string;
  assignedByUserId: string;
  status: string;
  assignedAt: string;
}
```

#### 2.2.7 `DocAttachmentItem`
```typescript
// SỬA THÀNH
export interface DocAttachmentItem {
  documentAttachmentId: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  mediaKind: "FILE" | "VIDEO" | string;
  uploadedAt: string;
  uploadedBy: string;
}
```

#### 2.2.8 `DocAccessRuleItem`
```typescript
// SỬA THÀNH
export interface DocAccessRuleItem {
  documentAccessRuleId: string;
  roleId: string | null;
  departmentId: string | null;
  status: string;
  createdAt: string;
}
```
→ Component [DocAccessRulesPanel.tsx](../src/pages/documents/components/DocAccessRulesPanel.tsx) đang đọc `r.ruleId` — phải đổi sang `r.documentAccessRuleId` và payload remove cũng phải truyền `{ documentAccessRuleId }` thay vì `{ ruleId }`.

#### 2.2.9 `DocFolderListResponse`
BE trả `{ items }`, FE expect `{ folders }`:
```typescript
// SỬA THÀNH
export interface DocFolderListResponse {
  items: DocFolderItem[];
}
```
Đồng thời `DocFolderItem` thêm field `createdAt: string`.

#### 2.2.10 `DocEditorListItem` — bớt field thừa
BE `Item` chỉ có `documentId, title, status, contentKind, updatedAt, published`. Bỏ `createdBy` và `folderPlacement` (không có trong response):
```typescript
export interface DocEditorListItem {
  documentId: string;
  title: string;
  status: "DRAFT" | "ACTIVE" | string;
  contentKind: string;
  updatedAt: string;
  published: boolean;
}
```
→ Nếu UI cần `folderPlacement` cho list view, phải hoặc (a) yêu cầu BE bổ sung field, hoặc (b) build map từ `apiDocFolderTreeWithDocuments` (hiện đang làm).

#### 2.2.11 `DocFolderNode` thêm `createdAt`
BE `FolderNode` có `createdAt` và `DocumentNode` có `updatedAt` — bổ sung vào type FE để badge "đã sửa" hiển thị đúng.

#### 2.2.12 `DocCommentItem` trong `DocEditorDetail`
BE trả flat list `comments` (mảng `CommentItem` với `parentCommentId` để FE tự build cây). Hiện FE đang khai báo đúng — chỉ cần verify rằng [DocumentEditor.tsx](../src/pages/documents/editor/DocumentEditor.tsx) build cây từ flat list (vì `apiDocCommentTree` mới trả tree thực sự).

### 2.3 `apiDocAccessRuleRemove` payload key

[editor.api.ts:139](../src/api/document/editor.api.ts#L139) truyền `{ ruleId }` nhưng BE request DTO field tên gì? Cần đọc `DocumentAccessRuleRemoveRequest.java`. Đề xuất: chuẩn hóa truyền `{ documentAccessRuleId: ruleId }` để khớp PK.

### 2.4 `apiDocList` truyền `params` undefined sẽ thành `{}`
OK — không bug, nhưng generic type của `gatewayRequest` đang infer `typeof params` (có `| undefined`) → nên cố định:
```typescript
type DocListParams = { titleQuery?: string; page?: number; pageSize?: number };
export const apiDocList = (params?: DocListParams) =>
  gatewayRequest<DocListParams, DocEditorListResponse>("com.sme.document.list", params ?? {});
```

---

## 3. Bổ sung wrapper API mới (FE)

Thêm vào [src/api/document/editor.api.ts](../src/api/document/editor.api.ts):

```typescript
// ── Read receipts (BE đã có) ──────────────────────────────────────────────────
export const apiDocReadList = (documentId: string, limit?: number) =>
  gatewayRequest<{ documentId: string; limit?: number }, DocReadListResponse>(
    "com.sme.document.read.list",
    { documentId, limit },
  );

// ── Folder tree (lite, không kèm documents) ───────────────────────────────────
export const apiDocFolderTree = () =>
  gatewayRequest<Record<string, never>, DocFolderTreeLiteResponse>(
    "com.sme.document.folder.tree",
    {},
  );

// ── Comment list (flat) ───────────────────────────────────────────────────────
export const apiDocCommentList = (documentId: string) =>
  gatewayRequest<{ documentId: string }, DocCommentListResponse>(
    "com.sme.document.comment.list",
    { documentId },
  );

// ── Access rule list ─────────────────────────────────────────────────────────
export const apiDocAccessRuleList = (documentId: string) =>
  gatewayRequest<{ documentId: string }, DocAccessRuleListResponse>(
    "com.sme.document.accessRule.list",
    { documentId },
  );

// ── Links (Phase 3 cross-doc) ────────────────────────────────────────────────
export const apiDocLinkAdd = (
  sourceDocumentId: string,
  targetDocumentId: string,
  linkType?: string,
) =>
  gatewayRequest<
    { sourceDocumentId: string; targetDocumentId: string; linkType?: string },
    { documentLinkId: string }
  >("com.sme.document.link.add", { sourceDocumentId, targetDocumentId, linkType });

export const apiDocLinkRemove = (documentLinkId: string) =>
  gatewayRequest("com.sme.document.link.remove", { documentLinkId });

export const apiDocLinkList = (documentId: string) =>
  gatewayRequest<{ documentId: string }, DocLinkListResponse>(
    "com.sme.document.link.list",
    { documentId },
  );

// ── Assignments ──────────────────────────────────────────────────────────────
export const apiDocAssignmentAssign = (documentId: string, assigneeUserId: string) =>
  gatewayRequest<
    { documentId: string; assigneeUserId: string },
    { documentAssignmentId: string }
  >("com.sme.document.assignment.assign", { documentId, assigneeUserId });

export const apiDocAssignmentUnassign = (documentAssignmentId: string) =>
  gatewayRequest("com.sme.document.assignment.unassign", { documentAssignmentId });

export const apiDocAssignmentList = (documentId: string) =>
  gatewayRequest<{ documentId: string }, DocAssignmentListResponse>(
    "com.sme.document.assignment.list",
    { documentId },
  );

// ── Attachments ──────────────────────────────────────────────────────────────
export const apiDocAttachmentAdd = (input: {
  documentId: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  mediaKind: "FILE" | "VIDEO";
}) =>
  gatewayRequest<typeof input, { documentAttachmentId: string }>(
    "com.sme.document.attachment.add",
    input,
  );

export const apiDocAttachmentRemove = (documentAttachmentId: string) =>
  gatewayRequest("com.sme.document.attachment.remove", { documentAttachmentId });

export const apiDocAttachmentList = (documentId: string) =>
  gatewayRequest<{ documentId: string }, DocAttachmentListResponse>(
    "com.sme.document.attachment.list",
    { documentId },
  );
```

**Type mới** cần khai báo trong `src/interface/document/editor.ts`:

```typescript
export interface DocReadListItem {
  userId: string;
  fullName: string;
  email: string;
  status: "READ" | "ACK" | string;
  readAt: string | null;
  ackedAt: string | null;
}
export interface DocReadListResponse { documentId: string; items: DocReadListItem[]; }

export interface DocCommentListResponse { documentId: string; items: DocCommentItem[]; }

export interface DocAccessRuleListResponse {
  documentId: string;
  rules: DocAccessRuleItem[];
}

export interface DocLinkListResponse { documentId: string; items: DocLinkItem[]; }
export interface DocAssignmentListResponse { documentId: string; items: DocAssignmentItem[]; }
export interface DocAttachmentListResponse { documentId: string; items: DocAttachmentItem[]; }

export interface DocFolderTreeLiteNode {
  folderId: string;
  parentFolderId: string | null;
  name: string;
  sortOrder: number;
  children: DocFolderTreeLiteNode[];
}
export interface DocFolderTreeLiteResponse { roots: DocFolderTreeLiteNode[]; }
```

**Detail request** mở rộng:
```typescript
export interface DocDetailParams {
  documentId: string;
  activityLimit?: number;     // default 50
  readLimit?: number;         // default 100
  commentLimit?: number;      // default 200
  /** "links,assignments,attachments,accessRules" — blank = all */
  include?: string;
  relationLimit?: number;     // default 100
}
export const apiDocDetail = (params: DocDetailParams) =>
  gatewayRequest<DocDetailParams, DocEditorDetail>("com.sme.document.detail", params);
```

---

## 4. Mở rộng UI để dùng các năng lực mới

### 4.1 DocumentDetail (FILE doc viewer) — Panel tab hóa

Hiện [DocumentDetail.tsx](../src/pages/documents/DocumentDetail.tsx) chỉ render preview file. Mở rộng:

```
┌──────────────────────────────────────────────────────────┐
│  [Tên file]                            [Tải xuống] [...] │
├──────────────────────────────────────────────────────────┤
│  [Xem trước] [Người đã đọc] [Liên kết] [Đính kèm]       │
├──────────────────────────────────────────────────────────┤
│  ... preview / panel theo tab ...                        │
└──────────────────────────────────────────────────────────┘
```

- **Tab "Người đã đọc"** (canViewStats): `apiDocReadList(documentId)` → bảng (avatar, tên, email, readAt, ackedAt, badge `ACK`/`READ`).
- **Tab "Liên kết"** (canEdit): `apiDocLinkList` + ô search doc + `apiDocLinkAdd` để thêm tài liệu liên quan, group theo `direction` OUT/IN.
- **Tab "Đính kèm"** (canEdit): `apiDocAttachmentList` + reuse Cloudinary upload path để lấy `fileUrl/fileName/fileType/fileSizeBytes/mediaKind` rồi gọi `apiDocAttachmentAdd`.
- Acknowledge: vẫn giữ nút ở header — sau khi ack thành công invalidate `["doc-read-list", documentId]` và refetch.

### 4.2 DocumentEditor — Drawer "Thông tin tài liệu"

Trong [DocumentEditor.tsx](../src/pages/documents/editor/DocumentEditor.tsx) bổ sung drawer phải với các tab tương ứng:

| Tab | Hook | Quyền |
|---|---|---|
| Versions | `apiDocVersionList` + `apiDocVersionGet` + `apiDocVersionCompare` (đã có, fix type) | `canViewVersions` |
| Người đã đọc | `apiDocReadList` (mới) | `canViewStats` |
| Comments | `apiDocCommentTree` (đã có) | tất cả |
| Liên kết | `apiDocLinkList/add/remove` (mới) | `canEdit` |
| Phân công | `apiDocAssignmentList/assign/unassign` (mới) | `canPublish` |
| Đính kèm | `apiDocAttachmentList/add/remove` (mới) | `canEdit` |
| Access rules | `apiDocAccessRuleList/add/remove` (mới + fix payload) | `canManageAccessRules` |
| Activity | từ `apiDocDetail.activity[]` | `canViewStats` |

**Lợi ích đo được:**
- Trước: phải `apiDocDetail` trả về **toàn bộ** bundle 7 mảng → payload lớn, refetch toàn bộ khi sửa 1 thứ.
- Sau: mỗi tab có queryKey riêng → mutation chỉ invalidate đúng key, FE responsive hơn.

### 4.3 Documents page — Folder picker khi move

Khi HR/MANAGER bấm "Di chuyển" 1 hay nhiều documents:
- Mở Modal với `<Tree>` build từ `apiDocFolderTree()` (lite — không kèm docs).
- Confirm → chuỗi `apiDocFolderRemoveDocument` (folder cũ) + `apiDocFolderAddDocument` (folder mới).

Hiện tại không có UI này → bổ sung ở Phase 3 ban đầu (HR Batch).

### 4.4 Documents page — Tab "Cần xác nhận" cho EMPLOYEE

Khi BE bổ sung op `acknowledgment.list` (xem §2.1), Tab "Cần xác nhận" lọc bằng `assignments` (giao bằng `apiDocAssignmentAssign`) và trừ những doc đã có `ack` của user. Trong lúc chờ:
```typescript
// Tạm thời: chỉ hiển thị FILE docs, dựa trên onboarding tasks
```

### 4.5 Admin audit dashboard — dùng `read.list` + `accessRule.list`

Phase 5 (audit) trong [document-page-development-plan.md](./document-page-development-plan.md) giờ có thể:
- Click 1 doc → drawer hiện đầy đủ `reads + accessRules + links + assignments + activity` mà không cần BE thay đổi.
- Bảng audit per-doc: cột "Số người đọc/Cần đọc" = `reads.length` / `assignments.length`.

---

## 5. Roadmap Phase mới — sau khi sync

### Phase 0 — Sync API (BLOCKER, ưu tiên 🔴)

| Task | File | Estimate |
|---|---|---|
| Sửa toàn bộ type lệch ở §2.2 | `src/interface/document/editor.ts` | S |
| Cập nhật `DocAccessRulesPanel` đọc `documentAccessRuleId` | `src/pages/documents/components/DocAccessRulesPanel.tsx` | XS |
| Đổi payload `apiDocAccessRuleRemove` thành `{ documentAccessRuleId }` | `src/api/document/editor.api.ts` | XS |
| Mở rộng `apiDocDetail` nhận `DocDetailParams` | `src/api/document/editor.api.ts` | S |
| Bổ sung 13 wrapper API mới (§3) + types | `src/api/document/editor.api.ts`, `src/interface/document/editor.ts` | M |
| Quyết định và xử lý `acknowledgment.list` (yêu cầu BE thêm op hoặc fallback) | `src/api/document/document.api.ts` | S |
| Verify request DTO key của `accessRule.remove` ở BE | – | XS |
| Xóa `apiSaveDocument` deprecated + import mồ côi | `src/api/document/document.api.ts` | XS |

### Phase 1 — DocumentDetail Tabbed Panel (🔴)

- Render `<Tabs>` quanh preview.
- Cài tab "Người đã đọc" + "Đính kèm" (đa số FILE docs hiện chỉ có 1 file gốc, attachments = bonus).

### Phase 2 — DocumentEditor Drawer "Info" (🟡)

- Replace logic gọi 1 cục `apiDocDetail` lấy hết → `apiDocDetail` chỉ lấy meta + content; mỗi tab gọi list riêng.
- Thêm tab Links / Assignments / Attachments.

### Phase 3 — Folder picker + Batch move (🟡)

- Modal với `apiDocFolderTree()`.
- Toolbar batch (đã đề cập trong plan cũ Phase 3).

### Phase 4 — Assignment workflow (🟢)

- Manager/HR có thể giao 1 doc cho danh sách user (multi-select) → tự sinh row trong `assignments`.
- EMPLOYEE thấy badge "Được giao" trên card.
- Sau khi `apiDocMarkRead` (READ) hoặc `apiAcknowledgeDocument` (ACK), BE tự update assignment.status ngầm — verify lại.

### Phase 5 — Cross-doc Links graph (🟢)

- Trong DocumentEditor, ô "Liên kết tài liệu" gợi ý bằng `apiDocList({ titleQuery })`.
- Hiển thị 2 cột: "Liên kết tới" (OUT) và "Được liên kết từ" (IN).

### Phase 6 — Attachments inline (🟢)

- Tab "Đính kèm" hỗ trợ upload qua endpoint Cloudinary giống upload doc → sau đó gọi `apiDocAttachmentAdd` với metadata trả về.
- Thumbnail cho `mediaKind === "VIDEO"`.

---

## 6. Query key convention (cập nhật)

```typescript
// Per-document scoped
['doc-detail', documentId, includeFlags]
['doc-versions', documentId]
['doc-version', versionId]
['doc-comments-tree', documentId]
['doc-comments-list', documentId]   // mới
['doc-reads', documentId]            // mới
['doc-access-rules', documentId]     // mới (thay vì lấy qua doc-detail)
['doc-links', documentId]            // mới
['doc-assignments', documentId]      // mới
['doc-attachments', documentId]      // mới

// Top-level
['doc-folder-tree']                  // tree + docs (Documents.tsx)
['doc-folder-tree-lite']             // tree only (folder picker)
['doc-folder-list']
['doc-list', listParams]
['doc-acknowledgments']              // user's own acks (chờ BE)
```

**Invalidation matrix:**

| Mutation | Invalidate |
|---|---|
| `apiDocPublish` | `doc-detail`, `doc-versions`, `doc-folder-tree`, `doc-list` |
| `apiDocUpdateDraft` / `apiDocAutosave` | `doc-detail` (chỉ key chính, debounce) |
| `apiDocCommentAdd/Update/Delete` | `doc-comments-tree`, `doc-comments-list`, `doc-detail` |
| `apiDocReadMark` | `doc-reads`, `doc-detail` |
| `apiAcknowledgeDocument` | `doc-reads`, `doc-acknowledgments` |
| `apiDocAccessRuleAdd/Remove` | `doc-access-rules`, `doc-detail` |
| `apiDocLinkAdd/Remove` | `doc-links` (cả 2 đầu doc nếu khác nhau) |
| `apiDocAssignmentAssign/Unassign` | `doc-assignments`, `doc-acknowledgments` |
| `apiDocAttachmentAdd/Remove` | `doc-attachments` |
| `apiDocFolderCreate/Rename/Move/Delete` | `doc-folder-tree`, `doc-folder-tree-lite`, `doc-folder-list` |
| `apiDocFolderAddDocument/RemoveDocument` | `doc-folder-tree`, `doc-detail` |

---

## 7. Cấu trúc thư mục đề xuất sau Phase 0–2

```
src/pages/documents/
├── Documents.tsx
├── DocumentDetail.tsx
├── editor/
│   ├── DocumentEditor.tsx
│   ├── DocVersionDiff.tsx               # Phase 6 (plan cũ)
│   └── DocumentInfoDrawer.tsx           # NEW — Phase 2 (tabs Versions/Reads/Links/...)
├── components/
│   ├── types.ts
│   ├── DocFolderTree.tsx
│   ├── DocFolderPickerModal.tsx         # NEW — Phase 3
│   ├── DocItemCard.tsx
│   ├── DocItemRow.tsx
│   ├── DocStatCard.tsx
│   ├── DocAccessRulesPanel.tsx          # FIX type field
│   ├── DocBatchToolbar.tsx              # NEW — Phase 3
│   ├── DocReadListPanel.tsx             # NEW — Phase 1
│   ├── DocLinksPanel.tsx                # NEW — Phase 5
│   ├── DocAssignmentsPanel.tsx          # NEW — Phase 4
│   └── DocAttachmentsPanel.tsx          # NEW — Phase 6
├── hooks/
│   ├── useDocumentPermissions.ts
│   ├── useDocumentReadStatus.ts         # NEW — dùng apiDocReadList
│   └── useDocFolderPicker.ts            # NEW — Phase 3
```

---

## 8. Kiểm thử (acceptance)

Sau Phase 0:
- [ ] `apiDocVersionList` trả `items` (không phải `versions`) — UI version drawer trong [DocumentEditor.tsx:410](../src/pages/documents/editor/DocumentEditor.tsx#L410) phải hiển thị `versionNo`, `uploadedAt`, `uploadedBy`.
- [ ] `apiDocVersionCompare` hiển thị `equal` boolean và summary đúng.
- [ ] Add/remove access rule không lỗi `documentAccessRuleId` undefined.
- [ ] Nút "Đã xác nhận" trong DocumentDetail check `status === 'ACK'` thay vì check tồn tại record.
- [ ] Không còn warning runtime `apiListAcknowledgments → 404` (hoặc op-not-found).
- [ ] `apiDocDetail` chấp nhận `include="links,attachments"` → response giảm payload.

Sau Phase 1–2:
- [ ] Tab "Người đã đọc" hiện danh sách `fullName, email, status, readAt, ackedAt`.
- [ ] Editor "Info drawer" mở mỗi tab tự fetch độc lập, không refetch toàn bundle.

Sau Phase 3:
- [ ] HR có thể chọn nhiều documents → "Di chuyển vào folder" → modal tree → confirm.

---

## 9. Phụ lục — đối chiếu chi tiết DTO

### 9.1 `DocumentEditorDetailResponse` (BE) ↔ `DocEditorDetail` (FE)

| Field BE | Field FE | Khớp |
|---|---|---|
| `documentId` | `documentId` | ✅ |
| `title` | `title` | ✅ |
| `description` | `description` | ✅ |
| `status` | `status` | ✅ |
| `contentKind` | `contentKind` | ✅ |
| `draftContent` (JsonNode) | `draftContent: unknown` | ✅ |
| `publishedContent` | `publishedContent: unknown` | ✅ |
| `publishedAt` (Date) | `publishedAt: string \| null` | ✅ (Jackson serialize ISO) |
| `publishedBy` | `publishedBy: string \| null` | ✅ |
| `createdAt`/`updatedAt` | same | ✅ |
| `activity[].action/actorUserId/detail/createdAt` | `DocActivityItem` | ✅ |
| `reads[].userId/status/readAt/ackedAt` | `DocReadItem { userId, readAt }` | ❌ thiếu `status`, `ackedAt` |
| `folderPlacement.{folderId,folderName,path}` | `DocFolderPlacement` | ✅ |
| `comments[]` (flat với parentCommentId) | `DocCommentItem[]` | ✅ |
| `links[].{documentLinkId,linkedDocumentId,linkType,direction,createdAt,createdBy}` | `DocLinkItem { linkId, url, title }` | ❌ sai hoàn toàn |
| `assignments[].{documentAssignmentId,assigneeUserId,assignedByUserId,status,assignedAt}` | `DocAssignmentItem { assignmentId, userId, assignedAt }` | ❌ |
| `attachments[].{documentAttachmentId,fileUrl,fileName,fileType,fileSizeBytes,mediaKind,uploadedAt,uploadedBy}` | `DocAttachmentItem { attachmentId, name, fileUrl, contentType, size }` | ❌ |
| `accessRules[].{documentAccessRuleId,roleId,departmentId,status,createdAt}` | `DocAccessRuleItem { ruleId, roleId, departmentId }` | ❌ |

### 9.2 `DocumentVersionListResponse` ↔ `DocVersionListResponse`

| BE | FE | Khớp |
|---|---|---|
| `documentId` | – | thiếu |
| `items[].documentVersionId` | `versions[].versionId` | tên khác |
| `items[].versionNo` | `versions[].versionNumber` | tên khác |
| `items[].fileUrl` | – | thiếu |
| `items[].richTextSnapshot` | – | thiếu |
| `items[].uploadedAt` | `versions[].publishedAt` | tên khác |
| `items[].uploadedBy` | `versions[].publishedBy` | tên khác |

### 9.3 `DocumentPublishResponse` ↔ FE return type

BE: `{ documentId, versionNo, documentVersionId }` — FE đang ignore. Cập nhật:
```typescript
export interface DocPublishResponse {
  documentId: string;
  versionNo: number;
  documentVersionId: string;
}
export const apiDocPublish = (documentId: string) =>
  gatewayRequest<{ documentId: string }, DocPublishResponse>(
    "com.sme.document.publish",
    { documentId },
  );
```
→ Sau publish, FE có thể navigate đến version mới hoặc hiện toast "Đã publish v{versionNo}".

---

## 10. Tóm tắt hành động ngay

1. **Hôm nay (Phase 0 — bug fixing)**: Sửa 8 type lệch (§2.2) + đổi payload accessRule.remove + tạo 13 wrapper API mới + tạo type mới. Hoàn tất ~1 ngày.
2. **Tuần này**: BE bổ sung `com.sme.document.acknowledgment.list` HOẶC FE thay bằng filter `apiDocReadList` per-doc.
3. **Tuần tới (Phase 1)**: Tabbed `DocumentDetail` với panel "Người đã đọc".
4. **Sprint sau (Phase 2)**: `DocumentInfoDrawer` cho editor — tách bundle, gọi list theo từng tab.
5. **Backlog**: Folder picker batch move, Assignment workflow, Cross-doc links, Attachments.

---

*Tài liệu này phát sinh từ phân tích đối chiếu code FE × BE tại commit hiện tại. Cập nhật khi BE/FE có thay đổi op hoặc DTO.*
