# Stripe Payment Workflow

## Overview

SME-Onboard sử dụng **Stripe** để xử lý thanh toán subscription. Tất cả API call đi qua gateway (`POST /api/v1/gateway`) với field `operationType`.

Có hai luồng thanh toán Stripe:

---

## Case 1 — Register & Pay (Đăng ký kèm thanh toán)

> **Trigger**: HR đăng ký công ty mới, chọn gói có phí, thanh toán ngay khi register.

### Flow

```
RegisterCompany (Steps 0–3)
    │
    ├── Step 0: Company Info
    ├── Step 1: Admin Info
    ├── Step 2: Plan Selection  ← chọn plan + billingCycle
    └── Step 3: Review → [Confirm & Pay]
            │
            ▼
    useRegisterCompany.handlePayment()
            │
            ├─ 1. apiRegisterCompany({ company, admin, planCode, billingCycle })
            │       └─ BE tạo company + admin user + subscription
            │       └─ Response: { companyId, userId, token, tenantId }
            │
            ├─ 2. setUser / setToken / setTenant → user IS authenticated ✓
            │
            ├─ 3. apiGetSubscription(companyId)
            │       └─ Lấy subscriptionId + invoiceId từ subscription vừa tạo
            │
            ├─ 4. apiGenerateInvoice(subscriptionId, periodStart, periodEnd)
            │       └─ (chỉ gọi nếu subscription chưa có invoiceId)
            │
            ├─ 5. apiCreatePaymentIntent(invoiceId)
            │       └─ BE tạo Stripe PaymentIntent
            │       └─ Response: { clientSecret: "pi_xxx_secret_xxx", intentId }
            │
            └─ 6. setPaymentState({ clientSecret, invoiceId, amount, planName, billingCycle })
                    └─ Chuyển sang Step 4 (RegisterStepPayment)
```

```
Step 4: RegisterStepPayment
    │
    ├─ Hiển thị order summary (plan, amount, billingCycle)
    │
    └─ StripeProvider (clientSecret) → CheckoutForm
            │
            └─ User điền card → stripe.confirmPayment()
                    returnUrl = /billing/payment/confirmation
                                ?from=register
                                &invoiceId={invoiceId}
                    │
                    [Stripe redirect]
                    │
                    ▼
    /billing/payment/confirmation?
        payment_intent=pi_xxx
        &payment_intent_client_secret=pi_xxx_secret_xxx
        &redirect_status=succeeded
        &from=register
        &invoiceId={invoiceId}
```

```
PaymentConfirmation.tsx  (isFromRegister = true)
    │
    ├─ 1. stripe.retrievePaymentIntent(clientSecret)
    │       └─ Lấy status từ Stripe trực tiếp
    │
    ├─ 2. apiGetPaymentStatus(paymentIntentId)
    │       └─ Sync trạng thái về BE (fire-and-forget)
    │
    ├─ 3. invalidate queries: subscription, invoices
    │
    └─ 4. redirect_status === "succeeded"
            └─ Hiển thị success UI
            └─ Auto-countdown 3s → navigate("/dashboard")
```

### Sequence Diagram

```
Browser          FE Hook           BE Gateway         Stripe
   │                │                   │                │
   │  [Confirm]     │                   │                │
   │──────────────► │                   │                │
   │                │ apiRegisterCompany│                │
   │                │──────────────────►│                │
   │                │◄── token + ids ───│                │
   │                │ apiGetSubscription│                │
   │                │──────────────────►│                │
   │                │◄── subscriptionId─│                │
   │                │ apiCreatePaymentIntent             │
   │                │──────────────────►│                │
   │                │                   │ createPaymentIntent
   │                │                   │───────────────►│
   │                │                   │◄── clientSecret│
   │                │◄── clientSecret ──│                │
   │                │                   │                │
   │  [Step 4: Stripe Form]             │                │
   │  confirmPayment(clientSecret)      │                │
   │─────────────────────────────────────────────────────►
   │                │                   │                │
   │◄── redirect ───────────────────────────────────────│
   │  /confirmation?redirect_status=succeeded            │
   │                │                   │                │
   │  retrievePaymentIntent             │                │
   │─────────────────────────────────────────────────────►
   │◄── status: succeeded ──────────────────────────────│
   │                │ apiGetPaymentStatus│                │
   │                │──────────────────►│                │
   │◄── navigate /dashboard             │                │
```

### Error Handling

| Situation | Behavior |
|-----------|----------|
| `clientSecret` không hợp lệ (`isValidStripeSecret` fails) | Hiển thị lỗi, không render Stripe form |
| `redirect_status !== "succeeded"` | Hiển thị error UI với message từ Stripe |
| `stripe.retrievePaymentIntent` throws | Hiển thị error UI |
| `apiGetPaymentStatus` fails | Warning toast, flow vẫn tiếp tục (non-blocking) |

---

## Case 2 — Plan Change & Pay (Đổi gói + thanh toán)

> **Trigger**: HR đang dùng hệ thống, muốn upgrade/downgrade gói subscription.

### Flow

```
/billing/plan (BillingPlan page)
    │
    ├─ Load plans (apiGetPlans)
    ├─ Load current subscription (apiGetSubscription)
    │
    └─ User click plan card → setSelected(planCode)
            │
            └─ Confirm Modal → [Confirm Change]
                    │
                    ▼
    handleConfirm()
    │
    ├─ Has existing subscription?
    │   ├─ YES → apiUpdateSubscription({ subscriptionId, planCode, billingCycle, status: "ACTIVE" })
    │   └─ NO  → apiCreateSubscription(companyId, planCode, billingCycle)
    │
    └─ onSuccess → handleSuccess(res)
```

```
handleSuccess(res: Subscription)
    │
    ├─ invalidate queries: subscription, plans
    ├─ setSelected(null)
    │
    ├─ invoiceId = res.invoiceId
    │   └─ (nếu không có) → apiGenerateInvoice(subscriptionId, periodStart, periodEnd)
    │
    ├─ invoiceId có? → navigate("/billing/checkout/{invoiceId}?amount=...")
    │                   └─ toast: "Vui lòng hoàn tất thanh toán"
    │
    ├─ prorateChargeVnd > 0 (no invoiceId) → navigate("/billing/invoices")
    │                                          └─ toast: "Hóa đơn đã được tạo"
    │
    └─ subscriptionId (free plan) → navigate("/billing/invoices")
                                     └─ toast: "Đăng ký thành công"
```

```
/billing/checkout/:invoiceId (Checkout.tsx)
    │
    ├─ Read invoiceId from URL params
    ├─ Read amount from query string
    │
    ├─ apiCreatePaymentIntent(invoiceId)
    │       └─ Response: { clientSecret, intentId }
    │
    └─ isValidStripeSecret(clientSecret)?
            └─ YES → StripeProvider + CheckoutForm
                    │
                    └─ stripe.confirmPayment()
                            returnUrl = /billing/payment/confirmation
                                        ?invoiceId={invoiceId}
                                        (NO &from=register)
                            │
                            [Stripe redirect]
```

```
PaymentConfirmation.tsx  (isFromRegister = false)
    │
    ├─ 1. stripe.retrievePaymentIntent(clientSecret)
    │
    ├─ 2. apiGetPaymentStatus(paymentIntentId)  (non-blocking)
    │
    ├─ 3. invalidate queries: subscription, invoices
    │
    └─ 4. redirect_status === "succeeded"
            └─ Hiển thị success UI: "Thanh toán thành công"
            └─ Button → navigate("/billing/invoices")
               (KHÔNG auto-redirect, user tự bấm)
```

### Sequence Diagram

```
Browser          Plan.tsx          BE Gateway         Stripe
   │                │                   │                │
   │ [Click plan]   │                   │                │
   │──────────────► │                   │                │
   │ [Confirm]      │                   │                │
   │──────────────► │                   │                │
   │                │ apiUpdateSubscription              │
   │                │──────────────────►│                │
   │                │◄── Subscription ──│                │
   │                │   {invoiceId, subscriptionId, ...} │
   │                │ apiGenerateInvoice│                │
   │                │──────────────────►│                │
   │                │◄── {invoiceId} ───│                │
   │◄── navigate /billing/checkout/{id} │                │
   │                │                   │                │
   │  [Checkout.tsx]│                   │                │
   │                │ apiCreatePaymentIntent(invoiceId)  │
   │                │──────────────────►│                │
   │                │                   │ createPaymentIntent
   │                │                   │───────────────►│
   │                │                   │◄── clientSecret│
   │                │◄── clientSecret ──│                │
   │  [Stripe Form] │                   │                │
   │  confirmPayment│                   │                │
   │─────────────────────────────────────────────────────►
   │◄── redirect ───────────────────────────────────────│
   │  /confirmation?redirect_status=succeeded            │
   │  [PaymentConfirmation]             │                │
   │  retrievePaymentIntent             │                │
   │─────────────────────────────────────────────────────►
   │◄── status: succeeded ──────────────────────────────│
   │                │ apiGetPaymentStatus│                │
   │                │──────────────────►│                │
   │  [Show success UI, go to /billing/invoices]         │
```

---

## So sánh hai Case

| | Case 1 (Register) | Case 2 (Plan Change) |
|---|---|---|
| **Entry point** | `RegisterCompany` Step 3 | `BillingPlan` page |
| **Auth** | Authenticated trong flow | Pre-authenticated |
| **Subscription** | Tạo mới qua `apiRegisterCompany` | Create hoặc Update |
| **Invoice** | Từ response subscription | Từ response hoặc `apiGenerateInvoice` |
| **Checkout page** | `RegisterStepPayment` (inline Step 4) | `/billing/checkout/:invoiceId` |
| **returnUrl `from`** | `?from=register` | Không có |
| **Sau khi thành công** | Auto-redirect `/dashboard` (3s) | Button → `/billing/invoices` |
| **billingCycle** | Được chọn ở Step 2, truyền qua hook | Được chọn ở Plan page toggle |

---

## Validation Guards

```ts
// lib/stripe.ts
export const isValidStripeSecret = (secret: string): boolean =>
  secret.startsWith("pi_") &&
  secret.includes("_secret_") &&
  !secret.includes("mock");
```

Nếu `clientSecret` không hợp lệ → không render `StripeProvider`, hiển thị error state.

---

## Routes liên quan

```
/register                           → RegisterCompany (Step 0–4)
/billing/plan                       → BillingPlan (Case 2 entry)
/billing/checkout/:invoiceId        → Checkout (Case 2 payment form)
/billing/payment/confirmation       → PaymentConfirmation (cả 2 case)
/billing/invoices                   → InvoiceList (sau Case 2)
/dashboard                          → Dashboard (sau Case 1)
```

Route `/billing/payment/confirmation` yêu cầu auth (`RequireAuth` + role HR).  
Trong Case 1: user đã được authenticate tự động trước khi redirect Stripe.

---

## Gateway Operations

| Operation | File | Mô tả |
|-----------|------|-------|
| `com.sme.billing.subscription.create` | `billing.api.ts` | Tạo subscription mới |
| `com.sme.billing.subscription.update` | `billing.api.ts` | Cập nhật plan/billingCycle |
| `com.sme.billing.invoice.generate` | `billing.api.ts` | Tạo invoice cho subscription |
| `com.sme.billing.payment.createIntent` | `billing.api.ts` | Tạo Stripe PaymentIntent → clientSecret |
| `com.sme.billing.payment.status` | `billing.api.ts` | Sync trạng thái payment về BE |

---

## Key Files

| File | Mô tả |
|------|-------|
| `src/hooks/useRegisterCompany.ts` | Logic Case 1: handlePayment() |
| `src/pages/auth/components/RegisterStepPayment.tsx` | Step 4 UI với Stripe form |
| `src/pages/billing/Plan.tsx` | Logic Case 2: handleConfirm(), handleSuccess() |
| `src/pages/billing/Checkout.tsx` | Checkout page dùng bởi Case 2 |
| `src/pages/billing/PaymentConfirmation.tsx` | Xử lý Stripe redirect (cả 2 case) |
| `src/components/payment/CheckoutForm.tsx` | Reusable Stripe PaymentElement |
| `src/components/payment/StripeProvider.tsx` | Bọc Elements với clientSecret |
| `src/api/billing/billing.api.ts` | Tất cả billing API functions |
| `src/interface/billing/index.ts` | TypeScript interfaces cho billing DTOs |
| `src/lib/stripe.ts` | Stripe init + isValidStripeSecret() |
