const EventBus = () => {
    const allHandlers = new Map();

    return {
        on: (type: string, handler: any) => {
            let handlers = allHandlers.get(type);

            if (!handlers) handlers = [handler];
            else handlers.push(handler);

            allHandlers.set(type, handlers);
        },
        off: (type: string, handler: any) => {
            let handlers = allHandlers.get(type);

            handlers && handlers.splice(handlers.indexOf(handler) >>> 0, 1);
        },
        emit: <T = any>(type: string, evt: T) => {
            let handlers = allHandlers.get(type);

            handlers && handlers.slice().forEach((handler: any) => handler(evt));
        },
    };
};

export const eventBus = EventBus();
