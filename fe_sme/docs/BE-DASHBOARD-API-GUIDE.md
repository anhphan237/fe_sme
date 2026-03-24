# Hướng dẫn BE - API Dashboard theo vai trò

**Phiên bản:** 1.0  
**Ngày cập nhật:** 2025  
**Người yêu cầu:** Frontend Team  
**Mục đích:** Cung cấp đặc tả chi tiết cho 2 API analytics cần thêm vào hệ thống BE để phục vụ Dashboard Employee và Dashboard Manager.

---

## 📋 Tổng quan

Hiện tại FE đã có các API analytics sau (hoạt động):

| Operation Type | Mô tả | Dashboard sử dụng |
|---|---|---|
| `com.sme.analytics.company.onboarding.summary` | Tổng quan onboarding toàn công ty | HR |
| `com.sme.analytics.company.onboarding.funnel` | Phân tích funnel trạng thái | HR |
| `com.sme.analytics.company.onboarding.byDepartment` | Thống kê theo phòng ban | HR, Manager |
| `com.sme.analytics.company.task.completion` | Tỉ lệ hoàn thành task | HR |

**2 API cần bổ sung:**

| Operation Type | Dashboard | Ưu tiên |
|---|---|---|
| `com.sme.analytics.employee.onboarding.myProgress` | Employee | 🟡 Cao |
| `com.sme.analytics.manager.team.summary` | Manager | 🟡 Cao |

---

## 🔌 Cổng giao tiếp (Gateway Pattern)

Tất cả API đều đi qua gateway duy nhất:

```
POST /api/v1/gateway
Content-Type: application/json
Authorization: Bearer <token>
```

**Request format chuẩn:**
```json
{
  "operationType": "com.sme.xxx.yyy.zzz",
  "requestId": "uuid-v4-random",
  "payload": { ... }
}
```

**Response format chuẩn:**
```json
{
  "success": true,
  "data": { ... },
  "message": "OK",
  "errorCode": null
}
```

---

## 📊 API 1: Employee Onboarding Progress

### Thông tin API

| Trường | Giá trị |
|---|---|
| **Operation Type** | `com.sme.analytics.employee.onboarding.myProgress` |
| **Mô tả** | Lấy tiến độ onboarding cá nhân của nhân viên đang đăng nhập |
| **Phương thức** | POST (qua Gateway) |
| **Auth** | Required (JWT) |

### Nghiệp vụ

Khi nhân viên vào Dashboard cá nhân, hệ thống cần hiển thị:
- Tỉ lệ hoàn thành tổng thể (% tasks đã xong / tổng tasks)
- Số lượng task theo từng trạng thái
- Số ngày đã trải qua kể từ ngày bắt đầu onboarding
- Ngày dự kiến hoàn thành (nếu có thể tính)
- Giai đoạn hiện tại đang thực hiện
- Tên milestone tiếp theo cần đạt

### Request

```json
{
  "operationType": "com.sme.analytics.employee.onboarding.myProgress",
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "payload": {
    "employeeId": "uuid-of-employee",
    "tenantId": "uuid-of-tenant"
  }
}
```

**Mô tả trường request:**

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `employeeId` | UUID | ✅ | ID nhân viên (từ `currentUser.employeeId`) |
| `tenantId` | UUID | ✅ | ID tenant công ty (từ `currentTenant.id`) |

### Response (Success)

```json
{
  "success": true,
  "data": {
    "instanceId": "uuid-of-onboarding-instance",
    "employeeId": "uuid-of-employee",
    "completionPercentage": 37,
    "totalTasks": 22,
    "completedTasks": 8,
    "pendingTasks": 12,
    "overdueTasks": 2,
    "daysInOnboarding": 15,
    "estimatedCompletionDate": "2025-03-15",
    "currentPhase": "Giai đoạn 2: Đào tạo kỹ năng",
    "currentPhaseIndex": 1,
    "nextMilestoneName": "Hoàn thành đào tạo kỹ thuật",
    "phases": [
      {
        "phaseId": "uuid-phase-1",
        "phaseName": "Giai đoạn 1: Hành chính",
        "totalTasks": 5,
        "completedTasks": 5,
        "isCompleted": true,
        "order": 0
      },
      {
        "phaseId": "uuid-phase-2",
        "phaseName": "Giai đoạn 2: Đào tạo kỹ năng",
        "totalTasks": 8,
        "completedTasks": 3,
        "isCompleted": false,
        "order": 1
      },
      {
        "phaseId": "uuid-phase-3",
        "phaseName": "Giai đoạn 3: Thực hành",
        "totalTasks": 6,
        "completedTasks": 0,
        "isCompleted": false,
        "order": 2
      },
      {
        "phaseId": "uuid-phase-4",
        "phaseName": "Giai đoạn 4: Đánh giá cuối kỳ",
        "totalTasks": 3,
        "completedTasks": 0,
        "isCompleted": false,
        "order": 3
      }
    ]
  },
  "message": "OK",
  "errorCode": null
}
```

**Mô tả trường response:**

| Trường | Kiểu | Mô tả |
|---|---|---|
| `instanceId` | UUID | ID của onboarding instance đang active |
| `employeeId` | UUID | ID nhân viên |
| `completionPercentage` | Integer [0–100] | % hoàn thành = (completedTasks / totalTasks) * 100 |
| `totalTasks` | Integer | Tổng số task trong onboarding instance |
| `completedTasks` | Integer | Số task có status = "Done" |
| `pendingTasks` | Integer | Số task chưa xong (total – completed) |
| `overdueTasks` | Integer | Số task quá hạn và chưa xong |
| `daysInOnboarding` | Integer | Số ngày kể từ `startDate` của instance |
| `estimatedCompletionDate` | Date (YYYY-MM-DD) \| null | Ngày dự kiến hoàn thành (có thể null) |
| `currentPhase` | String | Tên giai đoạn đang thực hiện |
| `currentPhaseIndex` | Integer | Index (0-based) của giai đoạn hiện tại |
| `nextMilestoneName` | String \| null | Tên milestone tiếp theo (có thể null) |
| `phases` | Array | Danh sách các giai đoạn với tiến độ |
| `phases[].phaseId` | UUID | ID của giai đoạn |
| `phases[].phaseName` | String | Tên giai đoạn |
| `phases[].totalTasks` | Integer | Số task trong giai đoạn |
| `phases[].completedTasks` | Integer | Số task đã hoàn thành trong giai đoạn |
| `phases[].isCompleted` | Boolean | Giai đoạn đã hoàn toàn xong chưa |
| `phases[].order` | Integer | Thứ tự hiển thị (0-based) |

### Response (Lỗi)

```json
{
  "success": false,
  "data": null,
  "message": "No active onboarding found for employee",
  "errorCode": "ANALYTICS_EMP_001"
}
```

| Mã lỗi | Mô tả |
|---|---|
| `ANALYTICS_EMP_001` | Không tìm thấy onboarding instance active cho employee |
| `ANALYTICS_EMP_002` | employeeId không hợp lệ hoặc không thuộc tenant |

### Logic nghiệp vụ

```
1. Tìm OnboardingInstance với employeeId + tenantId + status = "ACTIVE"
   - Nếu không có → trả lỗi ANALYTICS_EMP_001
2. Lấy tất cả Tasks của instance đó
3. Tính:
   - completedTasks = COUNT(tasks WHERE status = "DONE")
   - overdueTasks = COUNT(tasks WHERE dueDate < TODAY AND status != "DONE")
   - daysInOnboarding = DATEDIFF(TODAY, instance.startDate)
   - completionPercentage = ROUND(completedTasks / totalTasks * 100)
4. Lấy danh sách Phase/Stage từ template
5. Map tasks vào từng phase và tính progress theo phase
6. Xác định currentPhase = phase đầu tiên chưa isCompleted
7. Trả về kết quả
```

---

## 📊 API 2: Manager Team Summary

### Thông tin API

| Trường | Giá trị |
|---|---|
| **Operation Type** | `com.sme.analytics.manager.team.summary` |
| **Mô tả** | Tổng quan nhóm onboarding dưới sự quản lý của manager |
| **Phương thức** | POST (qua Gateway) |
| **Auth** | Required (JWT, role = MANAGER) |

### Nghiệp vụ

Khi manager vào Dashboard, hệ thống cần hiển thị:
- Số nhân viên đang onboarding trong nhóm của manager
- Số bao nhiêu người hoàn thành trong tháng/kỳ này
- Số task đang chờ manager review/approve
- Tỉ lệ hoàn thành chung của phòng ban
- Danh sách nhân viên "at risk" — có task quá hạn và không có tiến triển

### Request

```json
{
  "operationType": "com.sme.analytics.manager.team.summary",
  "requestId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "payload": {
    "managerId": "uuid-of-manager-user",
    "tenantId": "uuid-of-tenant",
    "dateFrom": "2025-01-01",
    "dateTo": "2025-01-31"
  }
}
```

**Mô tả trường request:**

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `managerId` | UUID | ✅ | ID user của manager (từ `currentUser.id`) |
| `tenantId` | UUID | ✅ | ID tenant (từ `currentTenant.id`) |
| `dateFrom` | Date (YYYY-MM-DD) | ❌ | Ngày bắt đầu kỳ thống kê (null = lấy tất cả) |
| `dateTo` | Date (YYYY-MM-DD) | ❌ | Ngày kết thúc kỳ thống kê (null = lấy tất cả) |

### Response (Success)

```json
{
  "success": true,
  "data": {
    "managerId": "uuid-of-manager",
    "periodFrom": "2025-01-01",
    "periodTo": "2025-01-31",
    "totalTeamInOnboarding": 8,
    "completedThisPeriod": 2,
    "myPendingReviewTasks": 5,
    "departmentCompletionRate": 64,
    "atRiskEmployees": [
      {
        "employeeId": "uuid-emp-1",
        "employeeName": "Nguyễn Văn A",
        "role": "Software Engineer",
        "instanceId": "uuid-instance-1",
        "overdueTaskCount": 3,
        "daysSinceLastProgress": 5,
        "lastProgressDate": "2025-01-12"
      },
      {
        "employeeId": "uuid-emp-2",
        "employeeName": "Trần Thị B",
        "role": "Business Analyst",
        "instanceId": "uuid-instance-2",
        "overdueTaskCount": 1,
        "daysSinceLastProgress": 3,
        "lastProgressDate": "2025-01-14"
      }
    ],
    "teamOnboardings": [
      {
        "employeeId": "uuid-emp-1",
        "employeeName": "Nguyễn Văn A",
        "instanceId": "uuid-instance-1",
        "status": "ACTIVE",
        "startDate": "2025-01-05",
        "completionPercentage": 35,
        "daysInOnboarding": 12
      }
    ]
  },
  "message": "OK",
  "errorCode": null
}
```

**Mô tả trường response:**

| Trường | Kiểu | Mô tả |
|---|---|---|
| `managerId` | UUID | ID manager |
| `periodFrom` / `periodTo` | Date \| null | Kỳ thống kê (echo từ request) |
| `totalTeamInOnboarding` | Integer | Số nhân viên đang ACTIVE onboarding của manager |
| `completedThisPeriod` | Integer | Số nhân viên hoàn thành (status=COMPLETED) trong kỳ |
| `myPendingReviewTasks` | Integer | Số task được giao cho managerId có status != "Done" |
| `departmentCompletionRate` | Integer [0–100] | Tỉ lệ hoàn thành task trung bình của cả team |
| `atRiskEmployees` | Array | Nhân viên có nguy cơ chậm |
| `atRiskEmployees[].employeeId` | UUID | ID nhân viên |
| `atRiskEmployees[].employeeName` | String | Tên nhân viên |
| `atRiskEmployees[].role` | String | Chức vụ/vai trò |
| `atRiskEmployees[].instanceId` | UUID | ID onboarding instance |
| `atRiskEmployees[].overdueTaskCount` | Integer | Số task quá hạn |
| `atRiskEmployees[].daysSinceLastProgress` | Integer | Số ngày không có tiến triển |
| `atRiskEmployees[].lastProgressDate` | Date | Ngày cập nhật task gần nhất |
| `teamOnboardings` | Array | Danh sách tóm tắt onboarding của từng thành viên |
| `teamOnboardings[].completionPercentage` | Integer [0–100] | % hoàn thành |
| `teamOnboardings[].daysInOnboarding` | Integer | Số ngày đã onboarding |

### Response (Lỗi)

```json
{
  "success": false,
  "data": null,
  "message": "Manager not found or not authorized",
  "errorCode": "ANALYTICS_MGR_001"
}
```

| Mã lỗi | Mô tả |
|---|---|
| `ANALYTICS_MGR_001` | managerId không hợp lệ hoặc không có quyền |
| `ANALYTICS_MGR_002` | dateFrom > dateTo |

### Logic nghiệp vụ

```
1. Xác nhận managerId thuộc tenant và có role = MANAGER
2. Lấy tất cả OnboardingInstance có:
   - managerUserId = managerId
   - tenantId = tenantId
   - (Nếu có dateFrom/dateTo): startDate nằm trong khoảng
3. Tính totalTeamInOnboarding = COUNT(instances WHERE status = "ACTIVE")
4. Tính completedThisPeriod = COUNT(instances WHERE status = "COMPLETED")
5. Tính myPendingReviewTasks:
   - Lấy tất cả Tasks được giao cho managerId (assignedUserId = managerId)
   - COUNT(tasks WHERE status != "Done")
6. Tính departmentCompletionRate:
   - Lấy tất cả tasks của tất cả instance trong team
   - ROUND(SUM(completedTasks) / SUM(totalTasks) * 100)
7. Xác định atRiskEmployees:
   - Employee có ít nhất 1 task overdue (dueDate < TODAY AND status != "Done")
   - VÀ không có task nào được cập nhật trong 3+ ngày gần đây
   - Sắp xếp: overdueTaskCount DESC, daysSinceLastProgress DESC
8. Lấy teamOnboardings summary cho từng instance
9. Trả về kết quả
```

---

## 🏗️ Gợi ý cấu trúc BE (Spring Boot)

### Handler/Operation class mới cần tạo

```
src/main/java/com/sme/
├── analytics/
│   ├── employee/
│   │   ├── MyProgressOperation.java          ← Xử lý myProgress
│   │   ├── MyProgressRequest.java
│   │   └── MyProgressResponse.java
│   └── manager/
│       ├── TeamSummaryOperation.java         ← Xử lý team.summary
│       ├── TeamSummaryRequest.java
│       └── TeamSummaryResponse.java
```

### Registration trong GatewayRouter

```java
// Thêm vào gateway operation registry
registry.register("com.sme.analytics.employee.onboarding.myProgress",
    myProgressOperation::handle);

registry.register("com.sme.analytics.manager.team.summary",
    teamSummaryOperation::handle);
```

---

## 📝 Ghi chú triển khai

- **Hiện tại:** FE đang dùng **mock data** (constants cứng trong code) cho cả 2 API này. Dashboard vẫn hiển thị đầy đủ UI với ghi chú "⏳ Demo data — Chờ API BE".
- **Khi BE hoàn thành:** FE Team sẽ thay mock constant bằng `useQuery` hook gọi vào operation type tương ứng.
- **Test:** Có thể dùng Postman collection `SME.postman_collection.json` có sẵn để kiểm tra.
- **Ưu tiên:** `myProgress` cho Employee dashboard trước (có thể phát triển độc lập), sau đó `team.summary` cho Manager.

---

*Tài liệu này được tạo bởi Frontend Team. Mọi thắc mắc liên hệ qua Slack channel #fe-be-sync.*
