import { useState, useCallback, useRef, useEffect } from "react";

export type PromiseStatus = "idle" | "pending" | "resolved" | "rejected";

interface UsePromiseHolder<T, E, R> {
  status: PromiseStatus;
  data: T | null;
  error: E | null;
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: R) => void;
}

interface PromiseHolderProps<T> {
  defaultValue?: T | null;
}

const usePromiseHolder = <T = unknown, E = unknown, R = unknown>({
  defaultValue,
}: PromiseHolderProps<T>): UsePromiseHolder<T, E, R> => {
  const [status, setStatus] = useState<PromiseStatus>("idle");
  const [data, setData] = useState<T | null>(defaultValue ?? null);
  const [error, setError] = useState<E>(null as E);
  const promiseRef = useRef<{
    resolve: (value: T) => void;
    reject: (reason?: R) => void;
  } | null>(null);

  const execute = useCallback<() => Promise<T>>(() => {
    setStatus("pending");
    setData(null);
    setError(null as E);

    return new Promise<T>((resolve, reject) => {
      promiseRef.current = { resolve, reject };
    })
      .then((response) => {
        setData(response);
        setStatus("resolved");
        return response;
      })
      .catch((err) => {
        setError(err);
        setStatus("rejected");
        throw err;
      });
  }, []);

  const resolve = useCallback((value: T) => {
    promiseRef.current?.resolve(value);
  }, []);

  const reject = useCallback((reason?: R) => {
    promiseRef.current?.reject(reason);
  }, []);

  useEffect(() => {
    return () => {
      if (promiseRef.current) promiseRef.current.reject();
      promiseRef.current = null;
    };
  }, []);

  return { status, data, error, execute, resolve, reject };
};

export default usePromiseHolder;
