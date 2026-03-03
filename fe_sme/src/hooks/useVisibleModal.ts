/**
 * useVisibleModal - ported from PMS internal system
 * Manages modal visibility + auto-resets modal key on close (to unmount/remount)
 *
 * @example
 * const [visible, setVisible, modalKey] = useVisibleModal()
 * <Modal key={modalKey} open={visible} onCancel={() => setVisible(false)} />
 */
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";

const useVisibleModal = (): [
  boolean,
  Dispatch<SetStateAction<boolean>>,
  number,
] => {
  const [visible, setVisible] = useState<boolean>(false);
  const [modalKey, setModalKey] = useState<number>(0);

  useEffect(() => {
    if (!visible) {
      setModalKey((prev) => prev + 1);
    }
  }, [visible]);

  return [visible, setVisible, modalKey];
};

export default useVisibleModal;
