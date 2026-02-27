/* ============================================================
 * Landing page data constants — all text via i18n key strings
 * ============================================================ */

export const NAV_LINK_KEYS = [
  { labelKey: "landing.nav.features", href: "#features" },
  { labelKey: "landing.nav.how_it_works", href: "#how-it-works" },
  { labelKey: "landing.nav.pricing", href: "#pricing" },
  { labelKey: "landing.nav.testimonials", href: "#testimonials" },
  { labelKey: "landing.nav.faq", href: "#faq" },
];

export const HERO_TRUST_KEYS = [
  "landing.hero.trust_setup",
  "landing.hero.trust_language",
  "landing.hero.trust_security",
  "landing.hero.trust_trial",
];

export const HERO_MOCK_STATS = [
  {
    valueKey: "12",
    labelKey: "landing.hero.mock_stat_onboarding",
    color: "text-blue-400",
  },
  {
    valueKey: "5",
    labelKey: "landing.hero.mock_stat_completed",
    color: "text-emerald-400",
  },
  {
    valueKey: "38",
    labelKey: "landing.hero.mock_stat_tasks",
    color: "text-amber-400",
  },
];

export const HERO_MOCK_EMPLOYEES = [
  { nameKey: "Nguyen Van A", progress: 75, dayLabel: "Day 7" },
  { nameKey: "Tran Thi B", progress: 45, dayLabel: "Day 3" },
  { nameKey: "Le Minh C", progress: 20, dayLabel: "Day 1" },
];

export const LOGO_COMPANIES = [
  { name: "TechVision", color: "#2563eb" },
  { name: "StartupX", color: "#7c3aed" },
  { name: "GrowthLab", color: "#059669" },
  { name: "DigitalFirst", color: "#d97706" },
  { name: "NexusCorp", color: "#dc2626" },
  { name: "ScaleUp", color: "#0891b2" },
  { name: "InnovateSME", color: "#9333ea" },
  { name: "PeopleCo", color: "#be185d" },
];

export const FEATURE_ITEMS = [
  {
    titleKey: "landing.features.checklist.title",
    descKey: "landing.features.checklist.desc",
    iconBg: "bg-blue-50 text-brand",
    icon: "✅",
  },
  {
    titleKey: "landing.features.chatbot.title",
    descKey: "landing.features.chatbot.desc",
    iconBg: "bg-violet-50 text-violet-600",
    icon: "🤖",
  },
  {
    titleKey: "landing.features.survey.title",
    descKey: "landing.features.survey.desc",
    iconBg: "bg-emerald-50 text-emerald-600",
    icon: "📊",
  },
  {
    titleKey: "landing.features.roles.title",
    descKey: "landing.features.roles.desc",
    iconBg: "bg-amber-50 text-amber-600",
    icon: "🔐",
  },
  {
    titleKey: "landing.features.documents.title",
    descKey: "landing.features.documents.desc",
    iconBg: "bg-rose-50 text-rose-600",
    icon: "📁",
  },
  {
    titleKey: "landing.features.automation.title",
    descKey: "landing.features.automation.desc",
    iconBg: "bg-sky-50 text-sky-600",
    icon: "⚡",
  },
];

export const STEPS_ITEMS = [
  {
    titleKey: "landing.how.step1.title",
    descKey: "landing.how.step1.desc",
    icon: "📋",
  },
  {
    titleKey: "landing.how.step2.title",
    descKey: "landing.how.step2.desc",
    icon: "👤",
  },
  {
    titleKey: "landing.how.step3.title",
    descKey: "landing.how.step3.desc",
    icon: "✅",
  },
  {
    titleKey: "landing.how.step4.title",
    descKey: "landing.how.step4.desc",
    icon: "📈",
  },
];

export const HOW_STATS = [
  {
    valueKey: "landing.how.stat1.value",
    labelKey: "landing.how.stat1.label",
    subKey: "landing.how.stat1.sub",
  },
  {
    valueKey: "landing.how.stat2.value",
    labelKey: "landing.how.stat2.label",
    subKey: "landing.how.stat2.sub",
  },
  {
    valueKey: "landing.how.stat3.value",
    labelKey: "landing.how.stat3.label",
    subKey: "landing.how.stat3.sub",
  },
];

export const PRICING_TIERS = [
  {
    nameKey: "landing.pricing.plan_basic.name",
    monthlyPrice: `${"$"}0`,
    yearlyPrice: `${"$"}0`,
    usersKey: "landing.pricing.plan_basic.users",
    descKey: "landing.pricing.plan_basic.desc",
    popular: false,
    features: [
      "landing.pricing.plan_basic.f1",
      "landing.pricing.plan_basic.f2",
      "landing.pricing.plan_basic.f3",
      "landing.pricing.plan_basic.f4",
      "landing.pricing.plan_basic.f5",
    ],
    ctaKey: "landing.pricing.plan_basic.cta",
  },
  {
    nameKey: "landing.pricing.plan_pro.name",
    monthlyPrice: `${"$"}49`,
    yearlyPrice: `${"$"}39`,
    usersKey: "landing.pricing.plan_pro.users",
    descKey: "landing.pricing.plan_pro.desc",
    popular: true,
    features: [
      "landing.pricing.plan_pro.f1",
      "landing.pricing.plan_pro.f2",
      "landing.pricing.plan_pro.f3",
      "landing.pricing.plan_pro.f4",
      "landing.pricing.plan_pro.f5",
      "landing.pricing.plan_pro.f6",
      "landing.pricing.plan_pro.f7",
    ],
    ctaKey: "landing.pricing.plan_pro.cta",
  },
  {
    nameKey: "landing.pricing.plan_business.name",
    monthlyPrice: `${"$"}129`,
    yearlyPrice: `${"$"}99`,
    usersKey: "landing.pricing.plan_business.users",
    descKey: "landing.pricing.plan_business.desc",
    popular: false,
    features: [
      "landing.pricing.plan_business.f1",
      "landing.pricing.plan_business.f2",
      "landing.pricing.plan_business.f3",
      "landing.pricing.plan_business.f4",
      "landing.pricing.plan_business.f5",
      "landing.pricing.plan_business.f6",
      "landing.pricing.plan_business.f7",
    ],
    ctaKey: "landing.pricing.plan_business.cta",
  },
  {
    nameKey: "landing.pricing.plan_enterprise.name",
    monthlyPrice: "",
    yearlyPrice: "",
    isContact: true,
    usersKey: "landing.pricing.plan_enterprise.users",
    descKey: "landing.pricing.plan_enterprise.desc",
    popular: false,
    features: [
      "landing.pricing.plan_enterprise.f1",
      "landing.pricing.plan_enterprise.f2",
      "landing.pricing.plan_enterprise.f3",
      "landing.pricing.plan_enterprise.f4",
      "landing.pricing.plan_enterprise.f5",
      "landing.pricing.plan_enterprise.f6",
      "landing.pricing.plan_enterprise.f7",
    ],
    ctaKey: "landing.pricing.plan_enterprise.cta",
  },
];

export const TESTIMONIALS = [
  {
    quoteKey: "landing.testimonials.t1.quote",
    nameKey: "landing.testimonials.t1.name",
    roleKey: "landing.testimonials.t1.role",
    avatarColor: "#2563eb",
  },
  {
    quoteKey: "landing.testimonials.t2.quote",
    nameKey: "landing.testimonials.t2.name",
    roleKey: "landing.testimonials.t2.role",
    avatarColor: "#7c3aed",
  },
  {
    quoteKey: "landing.testimonials.t3.quote",
    nameKey: "landing.testimonials.t3.name",
    roleKey: "landing.testimonials.t3.role",
    avatarColor: "#059669",
  },
];

export const FAQ_ITEMS = [
  { questionKey: "landing.faq.q1", answerKey: "landing.faq.a1" },
  { questionKey: "landing.faq.q2", answerKey: "landing.faq.a2" },
  { questionKey: "landing.faq.q3", answerKey: "landing.faq.a3" },
  { questionKey: "landing.faq.q4", answerKey: "landing.faq.a4" },
  { questionKey: "landing.faq.q5", answerKey: "landing.faq.a5" },
];

export const FOOTER_LINKS = [
  {
    titleKey: "landing.footer.group_product",
    links: [
      { labelKey: "landing.footer.product_features", href: "#features" },
      { labelKey: "landing.footer.product_pricing", href: "#pricing" },
      { labelKey: "landing.footer.product_updates", href: "#" },
      { labelKey: "landing.footer.product_roadmap", href: "#" },
    ],
  },
  {
    titleKey: "landing.footer.group_solutions",
    links: [
      { labelKey: "landing.footer.solutions_hr", href: "#" },
      { labelKey: "landing.footer.solutions_manager", href: "#" },
      { labelKey: "landing.footer.solutions_startup", href: "#" },
      { labelKey: "landing.footer.solutions_enterprise", href: "#" },
    ],
  },
  {
    titleKey: "landing.footer.group_resources",
    links: [
      { labelKey: "landing.footer.resources_blog", href: "#" },
      { labelKey: "landing.footer.resources_docs", href: "#" },
      { labelKey: "landing.footer.resources_api", href: "#" },
      { labelKey: "landing.footer.resources_status", href: "#" },
    ],
  },
  {
    titleKey: "landing.footer.group_company",
    links: [
      { labelKey: "landing.footer.company_about", href: "#" },
      { labelKey: "landing.footer.company_careers", href: "#" },
      { labelKey: "landing.footer.company_contact", href: "#" },
      { labelKey: "landing.footer.company_partners", href: "#" },
    ],
  },
];
