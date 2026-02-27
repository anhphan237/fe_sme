/**
 * EventBus — lightweight pub/sub event emitter
 * Ported from PMS internal system
 *
 * @example
 * eventBus.on('MY_EVENT', handler)
 * eventBus.emit('MY_EVENT', { data: '...' })
 * eventBus.off('MY_EVENT', handler)
 */

type Handler<T = unknown> = (evt: T) => void;

const EventBus = () => {
  const allHandlers = new Map<string, Handler[]>();

  return {
    on<T = unknown>(type: string, handler: Handler<T>): void {
      let handlers = allHandlers.get(type);
      if (!handlers) handlers = [handler as Handler];
      else handlers.push(handler as Handler);
      allHandlers.set(type, handlers);
    },

    off<T = unknown>(type: string, handler: Handler<T>): void {
      const handlers = allHandlers.get(type);
      if (handlers) {
        handlers.splice(handlers.indexOf(handler as Handler) >>> 0, 1);
      }
    },

    emit<T = unknown>(type: string, evt: T): void {
      const handlers = allHandlers.get(type);
      handlers?.slice().forEach((handler) => handler(evt as unknown));
    },
  };
};

export const eventBus = EventBus();
