// ─── Organization Interface ───────────────────────────────────────────────────
// UI-level types cho quá trình thiết lập tổ chức & chọn gói dịch vụ.
// Gateway DTO tương ứng nằm trong interface/gateway.ts.

export type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '500+';

export type Industry = 'technology' | 'finance' | 'healthcare' | 'retail' | 'manufacturing' | 'education' | 'logistics' | 'other';

export type Timezone = 'Asia/Ho_Chi_Minh' | 'Asia/Bangkok' | 'Asia/Singapore' | 'Asia/Tokyo' | 'Asia/Seoul' | 'UTC';

/** Form data khi setup tổ chức – dùng trong hook useOrgSetup */
export interface OrgSetupParams {
    companyName: string;
    companySize: CompanySize;
    industry: Industry;
    timezone: Timezone;
    logoBase64?: string;
}
