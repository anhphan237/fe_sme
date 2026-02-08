import { Dispatch, SetStateAction, useEffect, useState } from 'react';

const useVisibleModal = (): [boolean, Dispatch<SetStateAction<boolean>>, number] => {
    const [visible, setVisible] = useState<boolean>(false);
    const [modalKey, setModalKey] = useState<number>(0);

    useEffect(() => {
        if (!visible) {
            setModalKey(modalKey + 1);
        }
    }, [visible]);

    return [visible, setVisible, modalKey];
};

export default useVisibleModal;
