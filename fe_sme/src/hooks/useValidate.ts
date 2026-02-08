import { getDefaultFormError, yupValidate } from '@/utils/helpers';
import { useEffect, useState } from 'react';

type IValidate<T> = {
    fields: string[];
    formData: T;
    yupSchema: any;
    id: string;
};

export const useValidate = <T = any>({ fields, formData, yupSchema, id }: IValidate<T>) => {
    const [formError, setFormError] = useState(getDefaultFormError(fields));
    const [isValidForm, setIsValidForm] = useState<boolean>(false);
    const [isChange, setIsChange] = useState<boolean>(false);
    const [modalKey, setModalKey] = useState<number>(0);

    useEffect(() => {
        if (isChange) {
            handleValidate();
        }
    }, [formData, isChange]);

    const handleValidate = async () => {
        const resp = await yupValidate(yupSchema, formData);
        setIsValidForm(resp.isValid);
        setFormError({
            ...formError,
            ...resp.formError,
        });
    };

    const refreshForm = () => {
        setFormError(getDefaultFormError(fields));
        setIsValidForm(false);
        setIsChange(false);
        setModalKey(modalKey + 1);
    };

    return {
        formError,
        isValidForm,
        isChange,
        setIsChange,
        modalKey: `${id}-${modalKey}`,
        refreshForm,
        setFormError,
    };
};
