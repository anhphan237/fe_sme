/**
 * i18n setup ported from PMS internal system
 * Supports: vi_VN, en_US
 * Usage: const { t } = useLocale()
 *        t('global.save') → "Lưu" (in vi_VN)
 */
import type { MessageDescriptor } from "react-intl";
import { useIntl } from "react-intl";

import en_US from "./languages/en-US.json";
import vi_VN from "./languages/vi-VN.json";

export type LocaleKey = keyof typeof vi_VN | keyof typeof en_US;

export const localeConfig: Record<string, Record<string, string>> = {
  vi_VN: vi_VN as Record<string, string>,
  en_US: en_US as Record<string, string>,
};

interface FormatProps extends MessageDescriptor {
  id: LocaleKey | string;
}

/**
 * Hook for translations — mirrors PMS `useLocale()` pattern
 * @example
 * const { t } = useLocale()
 * t('global.save')                     // "Lưu"
 * t('employee.action.delete_confirm_message', { name: 'Nguyễn Văn A' })
 */
export const useLocale = () => {
  const { formatMessage, ...rest } = useIntl();

  const t = (text: string, values?: Record<string, any>): string => {
    if (!text) return "";
    try {
      return formatMessage({ id: text } as FormatProps, values);
    } catch {
      return text;
    }
  };

  return {
    ...rest,
    t,
  };
};
