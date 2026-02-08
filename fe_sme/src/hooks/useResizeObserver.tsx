import { useEffect, useRef } from 'react';

const useResizeObserver = <T extends Element = Element>(callback?: ResizeObserverCallback) => {
    const ref = useRef<T>(null);
    const callbackRef = useRef<ResizeObserverCallback | undefined>(callback);
    useEffect(() => {
        callbackRef.current = callback;
    });
    useEffect(() => {
        const resizeObserver = new ResizeObserver((entries, observer) => {
            if (callbackRef.current) {
                callbackRef.current(entries, observer);
            }
        });

        if (ref.current) {
            resizeObserver.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                resizeObserver.unobserve(ref.current);
            }
        };
    }, []);

    return [ref] as const;
};

export default useResizeObserver;