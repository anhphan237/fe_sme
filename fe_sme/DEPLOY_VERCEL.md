# Deploy lên Vercel

## Bước 1: Đẩy code lên GitHub

```bash
cd d:/fe_sme
git add .
git commit -m "Add Vercel config"
git push origin main
```

## Bước 2: Tạo project trên Vercel

1. Vào [vercel.com](https://vercel.com) → đăng nhập
2. **Add New** → **Project** → Import git repo
3. Chọn repository `fe_sme` (hoặc tên repo của bạn)

## Bước 3: Cấu hình Root Directory (nếu cần)

Nếu repo có cấu trúc:
```
fe_sme/          <- git root
  fe_sme/        <- app
    package.json
    vercel.json
```

→ Trong **Project Settings** → **General** → **Root Directory**: chọn `fe_sme`

Nếu `package.json` nằm ngay tại root repo thì bỏ qua bước này.

## Bước 4: Environment Variables

Trong **Project Settings** → **Environment Variables**, thêm:

| Name | Value |
|------|-------|
| `VITE_API_BASE_URL` | `https://sme-7aido.ondigitalocean.app` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` (key Stripe của bạn) |

## Bước 5: Deploy

- Vercel tự detect Vite → Build command: `npm run build`, Output: `dist`
- Click **Deploy** → chờ build xong

## Bước 6: CORS

Backend (`sme-7aido.ondigitalocean.app`) cần allow origin domain Vercel (vd: `https://fe-sme-xxx.vercel.app`) để API hoạt động.

---

## Xử lý 404 khi truy cập trực tiếp đường dẫn

Nếu bị 404 khi mở link trực tiếp (vd: `/billing/invoices`) hoặc refresh trang:

1. Đảm bảo `vercel.json` có rewrite: `"destination": "/"`
2. Thử đổi **Framework Preset** sang **Other** trong Project Settings (thay vì Vite auto-detect)
3. Redeploy sau khi sửa
