import { Dropdown, type MenuProps } from "antd";
import { GlobalOutlined, CheckOutlined } from "@ant-design/icons";
import { useLocale } from "@/i18n";
import { useUserStore } from "@/stores/user.store";
import type { Locale } from "@/stores/user.store";

type LangOption = {
  value: Locale;
  flag: string;
  labelKey: string;
  native: string;
};

const LANGUAGES: LangOption[] = [
  {
    value: "vi_VN",
    flag: "\uD83C\uDDFB\uD83C\uDDF3",
    labelKey: "lang.vi_VN",
    native: "VI",
  },
  {
    value: "en_US",
    flag: "\uD83C\uDDFA\uD83C\uDDF8",
    labelKey: "lang.en_US",
    native: "EN",
  },
];

export function LanguageSwitcher() {
  const { t } = useLocale();
  const locale = useUserStore((s) => s.locale);
  const setLocale = useUserStore((s) => s.setLocale);

  const current = LANGUAGES.find((l) => l.value === locale) ?? LANGUAGES[0];

  const menuItems: MenuProps["items"] = LANGUAGES.map((lang) => ({
    key: lang.value,
    label: (
      <div
        style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
        <span style={{ fontSize: 15 }}>{lang.flag}</span>
        <span
          style={{
            color: locale === lang.value ? "#0078ff" : "#4b5563",
            fontWeight: locale === lang.value ? 600 : 400,
          }}>
          {t(lang.labelKey)}
        </span>
        {locale === lang.value && (
          <CheckOutlined
            style={{ marginLeft: "auto", color: "#0078ff", fontSize: 11 }}
          />
        )}
      </div>
    ),
    onClick: () => setLocale(lang.value),
  }));

  return (
    <Dropdown
      menu={{ items: menuItems, selectedKeys: [locale] }}
      trigger={["click"]}
      placement="bottomRight"
      overlayStyle={{ borderRadius: 10, minWidth: 148 }}>
      <button
        type="button"
        aria-label={t("lang.select")}
        className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm text-slate-400 transition hover:bg-white/10 hover:text-white">
        <GlobalOutlined style={{ fontSize: 14 }} />
        <span className="text-[13px] font-medium">{current.native}</span>
      </button>
    </Dropdown>
  );
}
