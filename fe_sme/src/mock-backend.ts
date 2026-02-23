import type { BillingPlan } from '@/interface/gateway';

// ─── In-memory data store ─────────────────────────────────────────────────────

interface MockUser {
    id: string;
    fullName: string;
    email: string;
    password: string;
    tenantId: string;
    phone?: string;
}

const DB: { users: MockUser[] } = {
    users: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const delay = (ms = 600) => new Promise<void>(res => setTimeout(res, ms));

const ok = <T>(data: T) => ({ status: true, message: 'SUCCESS', result: data, data });

const fail = (message: string) => ({ status: false, message, result: null, data: null });

// ─── Mock Plans ───────────────────────────────────────────────────────────────

const MOCK_PLANS: BillingPlan[] = [
    {
        id: 'starter',
        name: 'Starter',
        description: 'Phù hợp cho doanh nghiệp nhỏ dưới 20 người',
        priceMonthly: 0,
        features: ['Tối đa 20 nhân viên', '5 template onboarding', '1 GB lưu trữ', 'Báo cáo cơ bản'],
        maxUsers: 20,
        maxOnboardings: 5,
    },
    {
        id: 'pro',
        name: 'Pro',
        description: 'Dành cho doanh nghiệp đang tăng trưởng',
        priceMonthly: 299000,
        priceYearly: 2990000,
        features: [
            'Tối đa 100 nhân viên',
            'Template không giới hạn',
            '10 GB lưu trữ',
            'Phân tích nâng cao',
            'Hỗ trợ ưu tiên',
            'Tích hợp email tự động',
        ],
        maxUsers: 100,
        maxOnboardings: 50,
    },
    {
        id: 'business',
        name: 'Business',
        description: 'Cho tổ chức quy mô trung bình đến lớn',
        priceMonthly: 799000,
        priceYearly: 7990000,
        features: [
            'Tối đa 500 nhân viên',
            'Tất cả tính năng Pro',
            '50 GB lưu trữ',
            'SSO / LDAP',
            'API truy cập đầy đủ',
            'SLA 99,9%',
            'Dedicated account manager',
        ],
        maxUsers: 500,
        maxOnboardings: 999,
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'Giải pháp thương lượng cho tập đoàn lớn',
        priceMonthly: 0,
        features: [
            'Không giới hạn nhân viên',
            'Tất cả tính năng Business',
            'Triển khai on-premise',
            'Đào tạo & tư vấn trực tiếp',
            'SLA tùy chỉnh',
            'Bảo mật nâng cao',
        ],
        maxUsers: 9999,
        maxOnboardings: 9999,
    },
];

// ─── Operation Handlers ───────────────────────────────────────────────────────

type Handler = (payload: any) => Promise<ReturnType<typeof ok> | ReturnType<typeof fail>>;

const HANDLERS: Record<string, Handler> = {
    /** Đăng ký tài khoản HR Owner mới */
    'com.sme.identity.auth.register': async payload => {
        await delay(900);
        const { fullName, email, password, phone } = payload ?? {};

        if (!email || !password || !fullName) {
            return fail('Vui lòng điền đầy đủ thông tin');
        }
        if (DB.users.find(u => u.email === email)) {
            return fail('Email này đã được sử dụng, vui lòng chọn email khác');
        }

        const userId = crypto.randomUUID();
        const tenantId = crypto.randomUUID();

        DB.users.push({ id: userId, fullName, email, password, tenantId, phone });

        return ok({
            accessToken: `mock_jwt_${userId.slice(0, 8)}`,
            tokenType: 'Bearer',
            expiresInSeconds: 86400,
            user: { id: userId, fullName, email, roleCode: 'HR_OWNER' },
            tenantId,
            onboardingStep: 'org_setup',
        });
    },

    /** Đăng nhập */
    'com.sme.identity.auth.login': async payload => {
        await delay(700);
        const { email, password } = payload ?? {};
        const user = DB.users.find(u => u.email === email && u.password === password);

        if (!user) {
            return fail('Email hoặc mật khẩu không chính xác');
        }

        return ok({
            accessToken: `mock_jwt_${user.id.slice(0, 8)}`,
            tokenType: 'Bearer',
            expiresInSeconds: 86400,
            user: { id: user.id, fullName: user.fullName, email: user.email, roleCode: 'HR_OWNER' },
        });
    },

    /** Kiểm tra email đã tồn tại chưa */
    'com.sme.identity.auth.checkEmailExists': async payload => {
        await delay(300);
        return ok({ exists: DB.users.some(u => u.email === payload?.email) });
    },

    /** Thiết lập thông tin tổ chức (bước 2) */
    'com.sme.onboarding.company.setup': async _payload => {
        await delay(800);
        return ok({ onboardingStep: 'plan_selection', companyId: crypto.randomUUID() });
    },

    /** Lấy danh sách gói dịch vụ (bước 3) */
    'com.sme.billing.plan.list': async () => {
        await delay(500);
        return ok({ plans: MOCK_PLANS });
    },

    /** Tạo subscription (hoàn tất onboarding) */
    'com.sme.billing.subscription.create': async _payload => {
        await delay(700);
        return ok({ onboardingStep: 'done', subscriptionId: crypto.randomUUID() });
    },
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Intercepts a gateway call and returns mock data.
 * Called by gatewayRequest() in api/request.ts when VITE_USE_IN_MEMORY_BACKEND=true.
 */
export const handleMockRequest = async (operationType: string, payload: unknown): Promise<any> => {
    const handler = HANDLERS[operationType];

    if (!handler) {
        console.warn(`[MockBackend] ⚠️  No handler for operationType: "${operationType}". Returning empty success.`);
        return ok(null);
    }

    console.info(`[MockBackend] ► ${operationType}`, payload);
    const result = await handler(payload);
    console.info(`[MockBackend] ◄ ${operationType}`, result);

    return result;
};
