import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type ShowToast = (text: string) => void;

const ToastContext = createContext<ShowToast>(() => {});

interface ToastProviderProps {
  children: ReactNode;
  duration?: number;
}

export function ToastProvider({ children, duration = 1800 }: ToastProviderProps) {
  const [msg, setMsg] = useState("");
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const toast = useCallback<ShowToast>(
    (text) => {
      setMsg(text);
      setShow(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setShow(false), duration);
    },
    [duration]
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className={`toast${show ? " show" : ""}`} role="status" aria-live="polite">
        {msg}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
