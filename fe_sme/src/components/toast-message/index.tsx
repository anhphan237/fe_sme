import { App } from "antd";
import { useEffect } from "react";
import { EventTypes, ToastMessageStatus } from "@/constants";
import { eventBus } from "@/utils/eventBus";

type Payload = { type: ToastMessageStatus; message: string };

const ToastMessage = () => {
  const { message } = App.useApp();

  useEffect(() => {
    const handler = (data: Payload) => {
      switch (data.type) {
        case ToastMessageStatus.SUCCESS:
          message.success(data.message);
          break;
        case ToastMessageStatus.ERROR:
          message.error(data.message);
          break;
        case ToastMessageStatus.WARNING:
          message.warning(data.message);
          break;
        case ToastMessageStatus.INFO:
          message.info(data.message);
          break;
      }
    };
    eventBus.on(EventTypes.SHOW_MESSAGE, handler);
    return () => eventBus.off(EventTypes.SHOW_MESSAGE, handler);
  }, [message]);

  return null;
};

export default ToastMessage;
