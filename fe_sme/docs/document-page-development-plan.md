# Document Page — Development Plan by Role

> **Codebase**: React 18 + TypeScript + Ant Design 6 + TanStack Query 5 + Zustand  
> **Ngày lập**: 2026-04-25  
> **Phạm vi**: `src/pages/documents/` — mở rộng theo từng role

---

## 1. Tổng quan kiến trúc hiện tại

### 1.1 Hai hệ thống tài liệu song song

| Layer | Loại | API gốc | Lưu trữ |
|---|---|---|---|
| **FILE** | Upload file (PDF, DOCX, v.v.) | `apiGetDocuments()` | Cloudinary (URL) |
| **EDITOR** | Rich-text (Tiptap JSON) | `apiDocFolderTreeWithDocuments()` | DB — draftContent / publishedContent |

Cả hai loại được map sang interface thống nhất `UnifiedDoc` tại `components/types.ts` để render cùng card/row.

### 1.2 Luồng dữ liệu

```
UserStore (Zustand)
  └─ currentUser.roles[]
        └─ canManage = roles.some(r => ["HR","MANAGER"].includes(r))

TanStack Query
  ├─ GET /api/v1/gateway → apiDocFolderTreeWithDocuments()  → folderTree + EDITOR docs
  ├─ GET /api/v1/gateway → apiGetDocuments()               → FILE docs
  └─ GET /api/v1/gateway → apiListAcknowledgments()        → acked docs của user hiện tại

Component tree (Documents.tsx)
  ├─ DocFolderTree      ← sidebar, chỉ render folder nếu canManage
  ├─ DocStatCard[]      ← thống kê tổng hợp
  ├─ DocItemCard[]      ← grid view
  └─ DocItemRow[]       ← list view
```

### 1.3 Phân quyền hiện tại

```typescript
// src/pages/documents/Documents.tsx:307
const canManage = roles.some(r => ["HR", "MANAGER"].includes(r));

// src/pages/documents/editor/DocumentEditor.tsx:575
const canEdit = roles.some(r => ["HR", "MANAGER", "ADMIN", "EMPLOYEE"].includes(r));

// src/routes/index.tsx — route guard
"/documents*"  →  allowedRoles: ["HR", "MANAGER", "EMPLOYEE"]
```

**Vấn đề**: ADMIN và STAFF không có route guard → cần bổ sung.

---

## 2. Ma trận quyền theo Role

| Tính năng | ADMIN | HR | MANAGER | EMPLOYEE | STAFF | IT |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Xem danh sách tài liệu | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Xem chi tiết / đọc nội dung | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Upload file | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Tạo EDITOR document | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Chỉnh sửa (edit draft) | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Publish document | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Quản lý folder (CRUD) | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Xem thống kê (StatCard) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Comment | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Acknowledge tài liệu | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Xem access rules | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Quản lý access rules | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Xóa tài liệu | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Xem version history | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| So sánh versions | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 3. API Reference

### 3.1 FILE Documents

```typescript
// src/api/document/document.api.ts

/** Lấy danh sách file documents, lọc theo category nếu có */
apiGetDocuments(documentCategoryId?: string): Promise<DocumentListResponse>

/** Upload file lên Cloudinary, trả về URL */
apiUploadDocumentFile(formData: FormData): Promise<UploadDocumentResponse>

/** Lấy danh sách tài liệu user đã acknowledge */
apiListAcknowledgments(): Promise<AcknowledgmentListItem[]>

/** Đánh dấu đã đọc/xác nhận tài liệu */
apiAcknowledgeDocument(documentId: string, onboardingId?: string): Promise<void>
```

### 3.2 EDITOR Documents — Folder

```typescript
// src/api/document/editor.api.ts

/** Cây folder kèm documents trong từng folder */
apiDocFolderTreeWithDocuments(): Promise<DocFolderNode[]>

/** Danh sách folder phẳng (không kèm documents) */
apiDocFolderList(): Promise<DocFolderNode[]>

apiDocFolderCreate(name: string, parentFolderId?: string): Promise<DocFolderNode>
apiDocFolderRename(folderId: string, name: string): Promise<void>
apiDocFolderMove(folderId: string, newParentFolderId?: string): Promise<void>
apiDocFolderDelete(folderId: string): Promise<void>

apiDocFolderAddDocument(folderId: string, documentId: string): Promise<void>
apiDocFolderRemoveDocument(folderId: string, documentId: string): Promise<void>
```

### 3.3 EDITOR Documents — Document lifecycle

```typescript
apiDocCreateDraft(title: string): Promise<{ documentId: string }>
apiDocUpdateDraft(documentId: string, title: string, content: TiptapDoc): Promise<void>
apiDocAutosave(documentId: string, title: string, content: TiptapDoc): Promise<void>
apiDocPublish(documentId: string): Promise<void>
apiDocDetail(documentId: string): Promise<DocEditorDetail>
apiDocList(params?: DocListParams): Promise<DocListResponse>
```

### 3.4 Versions

```typescript
apiDocVersionList(documentId: string): Promise<DocVersionItem[]>
apiDocVersionGet(versionId: string): Promise<DocVersionDetail>
apiDocVersionCompare(v1: string, v2: string): Promise<{ equal: boolean }>
```

### 3.5 Comments

```typescript
apiDocCommentAdd(documentId: string, body: string, parentId?: string): Promise<DocCommentTreeNode>
apiDocCommentTree(documentId: string): Promise<DocCommentTreeNode[]>
apiDocCommentUpdate(commentId: string, body: string): Promise<void>
apiDocCommentDelete(commentId: string): Promise<void>
```

### 3.6 Access Rules & Tracking

```typescript
apiDocMarkRead(documentId: string): Promise<void>
apiDocAccessRuleAdd(documentId: string, rule: DocAccessRuleInput): Promise<DocAccessRuleItem>
apiDocAccessRuleRemove(ruleId: string): Promise<void>
```

---

## 4. Interface Types chính

```typescript
// src/interface/document/index.ts
interface DocumentItem {
  documentId: string
  name: string
  fileUrl: string
  description?: string
  status: "ACTIVE" | "DRAFT"
  documentCategoryId?: string
}

// src/interface/document/editor.ts
interface DocEditorDetail {
  documentId: string
  title: string
  description?: string
  status: "DRAFT" | "ACTIVE"
  published: boolean
  draftContent: TiptapDoc | null
  publishedContent: TiptapDoc | null
  publishedAt?: string
  publishedBy?: string
  createdAt: string
  updatedAt: string
  folderPlacement: DocFolderPlacement | null
  activity: DocActivityItem[]
  reads: DocReadItem[]          // { userId, readAt }
  comments: DocCommentTreeNode[]
  links: DocLinkItem[]
  assignments: DocAssignmentItem[]
  attachments: DocAttachmentItem[]
  accessRules: DocAccessRuleItem[]
}

interface DocFolderNode {
  folderId: string
  parentFolderId: string | null
  name: string
  sortOrder: number
  children: DocFolderNode[]
  documents: DocFolderDocument[]
}

interface DocCommentTreeNode {
  commentId: string
  parentCommentId: string | null
  authorUserId: string
  body: string
  status: "ACTIVE" | "DELETED"
  createdAt: string
  updatedAt: string
  children: DocCommentTreeNode[]
}
```

---

## 5. Bố cục Page theo Role

### 5.1 EMPLOYEE — View & Acknowledge

```
┌─────────────────────────────────────────────────────┐
│  Documents                                           │
│  "Tài liệu công ty"                                  │
├─────────────────────────────────────────────────────┤
│  [Search...]          [All | Editor | File]  [⊞][≡] │
├─────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────┐   │
│  │ Tab: Tất cả  |  Chưa đọc  |  Cần xác nhận   │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ DocCard  │ │ DocCard  │ │ DocCard  │  ...        │
│  │ [Đọc]   │ │ [Đọc]   │ │[Xác nhận]│            │
│  └──────────┘ └──────────┘ └──────────┘            │
└─────────────────────────────────────────────────────┘
```

**Thành phần hiển thị:**
- Không hiển thị: DocStatCard, folder sidebar, upload/create buttons
- Hiển thị tab lọc: "Tất cả", "Chưa đọc" (docs chưa có trong reads[]), "Cần xác nhận"
- Nút "Xác nhận" chỉ hiện với FILE documents chưa acknowledge
- Card action: **Xem** (→ DocumentDetail), không có Edit/Delete

**Logic lọc "Chưa đọc":**
```typescript
// Lấy từ DocEditorDetail.reads[] hoặc tracking riêng cho FILE docs
const unread = docs.filter(doc => !doc.reads.some(r => r.userId === currentUser.id))
```

---

### 5.2 HR — Full Management

```
┌───────────────────────────────────────────────────────────────┐
│  Documents                              [+ Upload] [+ Tạo mới]│
│  Quản lý tài liệu nội bộ                                       │
├─────────────────────────────────────────────────────────────────
│  ┌─ StatCard ─┐ ┌─ StatCard ─┐ ┌─ StatCard ─┐ ┌─ StatCard ─┐│
│  │ Tổng       │ │ Đã publish │ │ Draft       │ │ Files      ││
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘│
├────────────┬────────────────────────────────────────────────────
│ Folder     │  [Search...]        [All|Editor|File]  [⊞][≡]   │
│ Tree       │─────────────────────────────────────────────────  │
│            │  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ [+ Folder] │  │ DocCard  │ │ DocCard  │ │ DocCard  │ ...    │
│            │  │ [Sửa]    │ │ [Sửa]   │ │ [Xóa]   │        │
│ ▶ Folder A │  │ [Publish]│ │ [Publish]│ └──────────┘        │
│   ▶ Sub B  │  └──────────┘ └──────────┘                      │
│ ▶ Folder C │                                                   │
└────────────┴───────────────────────────────────────────────────
```

**Thành phần hiển thị:**
- DocStatCard (4 cards: tổng, published, draft, files)
- DocFolderTree với đầy đủ CRUD
- Upload file + Tạo mới buttons
- Card actions: **Xem / Sửa / Xóa / Publish / Access Rules**
- Batch actions: chọn nhiều → xóa, di chuyển folder

---

### 5.3 MANAGER — Manage + Readonly Stats

```
┌───────────────────────────────────────────────────────────────┐
│  Documents                              [+ Upload] [+ Tạo mới]│
│  Tài liệu của nhóm bạn                                         │
├─────────────────────────────────────────────────────────────────
│  ┌─ StatCard ─┐ ┌─ StatCard ─┐ ┌─ StatCard ─┐               │
│  │ Tổng       │ │ Đã publish │ │ Draft       │               │
│  └────────────┘ └────────────┘ └────────────┘               │
├────────────┬────────────────────────────────────────────────────
│ Folder     │  [Search...]        [All|Editor|File]  [⊞][≡]   │
│ Tree       │                                                    │
│            │  ┌──────────┐ ┌──────────┐ ...                  │
│ [+ Folder] │  │ DocCard  │ │ DocCard  │                      │
│            │  │ [Sửa]    │ │ [Xem]   │                      │
│            │  │ [Publish]│ └──────────┘                      │
│            │  └──────────┘                                    │
└────────────┴───────────────────────────────────────────────────
```

**Khác với HR:**
- Không có nút Xóa (chỉ HR/ADMIN mới xóa được)
- Không quản lý Access Rules
- StatCard: 3 cards (không có Files nếu muốn giới hạn)

---

### 5.4 ADMIN — Audit View

```
┌───────────────────────────────────────────────────────────────┐
│  Documents — Admin                                             │
│  Tổng quan hệ thống tài liệu                                   │
├─────────────────────────────────────────────────────────────────
│  ┌─ StatCard ─┐ ┌─ StatCard ─┐ ┌─ StatCard ─┐ ┌─ StatCard ─┐│
│  │ Tổng       │ │ Đã publish │ │ Draft       │ │ Files      ││
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘│
├────────────────────────────────────────────────────────────────
│  [Search...]   [All|Editor|File]  [⊞][≡]   [Filter: Role ▼] │
├────────────────────────────────────────────────────────────────
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                      │
│  │ DocCard  │ │ DocCard  │ │ DocCard  │ ...                  │
│  │ [Xem]   │ │ [Xem]   │ │ [Xóa]   │                      │
│  └──────────┘ └──────────┘ └──────────┘                      │
└────────────────────────────────────────────────────────────────
```

**Khác với HR/MANAGER:**
- Không có Upload / Tạo mới (ADMIN chỉ audit, không tạo nội dung)
- Không có folder sidebar (xem toàn bộ flat list)
- Có thêm filter theo Role/Department để audit access
- Có nút Xóa (ADMIN có quyền xóa bất kỳ)
- Xem Access Rules của từng document

---

## 6. Kế hoạch mở rộng từng Phase

### Phase 1 — Fix Route Guard & Permissions (Ưu tiên cao)

**Vấn đề**: Route hiện tại chỉ cho `["HR", "MANAGER", "EMPLOYEE"]`, thiếu ADMIN.

```typescript
// src/routes/index.tsx — cần cập nhật
{
  path: "/documents",
  allowedRoles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],  // thêm ADMIN
}
```

**Tasks:**
- [ ] Thêm `ADMIN` vào route guard của `/documents*`
- [ ] Tách biến `canManage` thành object rõ ràng hơn:
  ```typescript
  const permissions = {
    canCreate: roles.some(r => ["HR", "MANAGER"].includes(r)),
    canDelete: roles.some(r => ["ADMIN", "HR"].includes(r)),
    canManageFolder: roles.some(r => ["HR", "MANAGER"].includes(r)),
    canPublish: roles.some(r => ["HR", "MANAGER"].includes(r)),
    canManageAccessRules: roles.some(r => ["ADMIN", "HR"].includes(r)),
    canViewStats: roles.some(r => ["ADMIN", "HR", "MANAGER"].includes(r)),
    canAcknowledge: roles.some(r => ["EMPLOYEE"].includes(r)),
    canViewVersions: roles.some(r => ["ADMIN", "HR", "MANAGER"].includes(r)),
  }
  ```
- [ ] Áp dụng `permissions` object vào `Documents.tsx` và `DocumentEditor.tsx`

---

### Phase 2 — EMPLOYEE Experience

**Mục tiêu**: Trải nghiệm đọc tài liệu tập trung, không bị nhiễu bởi các tính năng quản lý.

**Thay đổi `Documents.tsx`:**
1. Ẩn `DocStatCard` khi `!permissions.canViewStats`
2. Ẩn `DocFolderTree` sidebar khi `!permissions.canManageFolder` — hiện thị flat list
3. Thêm Tab component (Ant Design `<Tabs>`) với 3 tab:
   - **Tất cả** — toàn bộ published docs
   - **Chưa đọc** — filter bằng `DocEditorDetail.reads[]`
   - **Cần xác nhận** — filter từ `apiListAcknowledgments()`

```typescript
// Hook mới: src/hooks/useDocumentReadStatus.ts
export function useDocumentReadStatus(documentId: string) {
  const { currentUser } = useUserStore()
  const { data: detail } = useQuery({
    queryKey: ['doc-detail', documentId],
    queryFn: () => apiDocDetail(documentId),
  })
  return {
    isRead: detail?.reads.some(r => r.userId === currentUser?.id) ?? false,
    totalReads: detail?.reads.length ?? 0,
  }
}
```

4. Nút "Xác nhận đã đọc" (`apiAcknowledgeDocument`) nổi bật hơn trên `DocumentDetail.tsx`

---

### Phase 3 — HR Full Management UI

**Mục tiêu**: Dashboard quản lý toàn diện với thao tác batch.

**Thêm vào `Documents.tsx`:**
1. Batch select (checkbox trên mỗi card/row) → toolbar hiện khi chọn ≥1
   ```
   [✓ 3 đã chọn]  [Di chuyển vào folder ▼]  [Xóa]  [Hủy]
   ```
2. Column "Trạng thái" rõ ràng hơn trên list view (badge DRAFT/PUBLISHED)
3. Quick publish từ list (không cần vào editor)

**Thêm vào `DocumentDetail.tsx`:**
1. Panel "Access Rules" — hiển thị danh sách rule, thêm/xóa
   ```typescript
   // Component mới: src/pages/documents/components/DocAccessRulesPanel.tsx
   // Props: documentId, rules: DocAccessRuleItem[], canManage: boolean
   ```
2. Tab "Người đọc" hiển thị `reads[]` với avatar + thời gian

**Thêm vào `DocItemCard.tsx` / `DocItemRow.tsx`:**
1. Hiển thị access rule badge nếu document có rule giới hạn (khóa 🔒)

---

### Phase 4 — MANAGER Scoped View

**Mục tiêu**: MANAGER chỉ thấy documents liên quan đến team của họ.

**API filtering** — cần backend hỗ trợ thêm param:
```typescript
// Đề xuất thêm param vào apiDocList()
apiDocList({ scopedToManager: currentUser.id })
// hoặc lọc theo department
apiDocList({ departmentId: currentUser.departmentId })
```

**Frontend:**
- Nếu backend chưa hỗ trợ: filter client-side dựa trên `accessRules[]`
- Thêm indicator "Tài liệu của team bạn" trên header

---

### Phase 5 — ADMIN Audit Dashboard

**Mục tiêu**: Bảng điều khiển audit toàn hệ thống.

**Trang mới hoặc tab**: `/documents?view=admin`

**Thành phần:**
1. **DocAuditStats** — mở rộng từ `DocStatCard`:
   - Số tài liệu theo từng role được phân quyền
   - Documents chưa có access rule nào (public)
   - Documents có ≥5 người đọc vs chưa ai đọc

2. **Filter nâng cao**:
   ```
   [Tất cả loại ▼]  [Tất cả trạng thái ▼]  [Tất cả role ▼]  [Tìm kiếm...]
   ```

3. **Bảng audit log** — từ `DocEditorDetail.activity[]`:
   | Thời gian | Người dùng | Hành động | Tài liệu |
   |---|---|---|---|
   | 2026-04-25 09:00 | Nguyễn Văn A | PUBLISHED | Nội quy công ty |

---

### Phase 6 — Version History UI (HR + MANAGER + ADMIN)

**Mục tiêu**: So sánh phiên bản trực quan.

**Thêm vào `DocumentEditor.tsx`:**
1. Version drawer đã có — bổ sung diff view:
   ```typescript
   // Component mới: src/pages/documents/editor/DocVersionDiff.tsx
   // Dùng thư viện diff-match-patch hoặc react-diff-viewer
   // So sánh TiptapDoc → convert sang plain text → diff
   ```
2. Restore version: confirm dialog → `apiDocUpdateDraft(id, title, restoredContent)`

---

## 7. Cấu trúc file đề xuất sau khi mở rộng

```
src/pages/documents/
├── Documents.tsx                    # Main page (cần refactor Phase 1-3)
├── DocumentDetail.tsx               # File viewer (Phase 3)
├── editor/
│   ├── DocumentEditor.tsx           # Rich text editor (Phase 1, 6)
│   └── DocVersionDiff.tsx           # NEW — Phase 6
├── components/
│   ├── types.ts                     # UnifiedDoc interface
│   ├── DocFolderTree.tsx            # Folder sidebar
│   ├── DocItemCard.tsx              # Grid card
│   ├── DocItemRow.tsx               # List row
│   ├── DocStatCard.tsx              # Stat card
│   ├── DocAccessRulesPanel.tsx      # NEW — Phase 3
│   ├── DocAuditStats.tsx            # NEW — Phase 5
│   └── DocBatchToolbar.tsx          # NEW — Phase 3
├── hooks/
│   ├── useDocumentReadStatus.ts     # NEW — Phase 2
│   └── useDocumentPermissions.ts    # NEW — Phase 1 (tách permissions)
└── constants/
    └── permissions.ts               # NEW — Phase 1 (permission definitions)
```

---

## 8. Thứ tự ưu tiên

| # | Phase | Ưu tiên | Effort | Impact |
|---|---|---|---|---|
| 1 | Fix Route Guard & Permissions object | 🔴 Cao | S | ADMIN access |
| 2 | EMPLOYEE Tab UI (chưa đọc, xác nhận) | 🔴 Cao | M | UX chính |
| 3 | HR Batch actions | 🟡 Trung | M | Productivity |
| 4 | DocAccessRulesPanel | 🟡 Trung | M | Security UX |
| 5 | MANAGER Scoped View | 🟡 Trung | L | Cần BE support |
| 6 | ADMIN Audit Dashboard | 🟢 Thấp | L | Monitoring |
| 7 | Version Diff View | 🟢 Thấp | L | Nice-to-have |

---

## 9. Ghi chú kỹ thuật

### Query Keys convention
```typescript
// Đề nghị chuẩn hóa query keys
['doc-folder-tree']              // folderTree
['doc-list', params]             // flat doc list
['doc-detail', documentId]       // single doc detail
['doc-versions', documentId]     // version list
['doc-comments', documentId]     // comment tree
['doc-acknowledgments']          // user's acked docs
```

### Invalidation sau mutations
```typescript
// Sau khi publish/update
queryClient.invalidateQueries({ queryKey: ['doc-detail', documentId] })
queryClient.invalidateQueries({ queryKey: ['doc-folder-tree'] })
queryClient.invalidateQueries({ queryKey: ['doc-list'] })
```

### i18n keys cần thêm
```
document.tab.all / document.tab.unread / document.tab.pending_ack
document.batch.selected / document.batch.move_to / document.batch.delete
document.access.rules / document.access.add_rule / document.access.remove_rule
document.audit.title / document.audit.activity_log
document.version.compare / document.version.restore / document.version.no_changes
```

---

*Tài liệu này được sinh tự động dựa trên phân tích code. Cập nhật khi có thay đổi API hoặc yêu cầu mới.*
