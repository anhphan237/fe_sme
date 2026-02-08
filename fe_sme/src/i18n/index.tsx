import type { MessageDescriptor } from 'react-intl';

import { useIntl } from 'react-intl';

import en_US from './languages/en-US.json';
import vi_VN from './languages/vi-VN.json';
export const localeConfig = {
    vi_VN: vi_VN,
    en_US: en_US,
};

type ViId = keyof typeof vi_VN;
type EnId = keyof typeof en_US;
interface Props extends MessageDescriptor {
    id: ViId | EnId | string;
}

export const useLocale = () => {
    const { formatMessage, ...rest } = useIntl();

    const format = (text: string, values?: Record<string, any>) => {
        if (!text) return '';
        return formatMessage({ id: text }, values);
    };

    return {
        ...rest,
        t: format,
    };
};
