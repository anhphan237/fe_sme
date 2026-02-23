// ─── Auth Interface ───────────────────────────────────────────────────────────
// Định nghĩa types cho toàn bộ luồng xác thực & onboarding setup.
// Thuộc interface/ theo đúng cấu trúc project.

/** Bước hiện tại của HR trong luồng onboarding sau đăng ký */
export type OnboardingStep = 'org_setup' | 'plan_selection' | 'done';

/**
 * Form data người dùng nhập khi đăng ký tài khoản.
 * Tách biệt với RegisterRequest (gateway DTO) để giữ SRP.
 */
export interface RegisterParams {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone?: string;
}
