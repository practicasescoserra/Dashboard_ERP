import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircleIcon, PencilIcon, TrashBinIcon, ErrorIcon } from "../icons";

const ToastContext = createContext(null);

const TOAST_CONFIG = {
  create: { icon: CheckCircleIcon, color: "text-success-500", bg: "bg-success-50 dark:bg-success-500/15", border: "border-success-500" },
  edit: { icon: PencilIcon, color: "text-warning-500", bg: "bg-warning-50 dark:bg-warning-500/15", border: "border-warning-500" },
  delete: { icon: TrashBinIcon, color: "text-error-500", bg: "bg-error-50 dark:bg-error-500/15", border: "border-error-500" },
  error: { icon: ErrorIcon, color: "text-error-500", bg: "bg-error-50 dark:bg-error-500/15", border: "border-error-500" },
};

const DEFAULT_MESSAGES = {
  create: (entity) => `${entity} creado exitosamente`,
  edit: (entity) => `${entity} editado exitosamente`,
  delete: (entity) => `${entity} eliminado exitosamente`,
  error: () => "Ocurrió un error",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((action, entity = "Elemento", customMessage = null) => {
    const id = Date.now() + Math.random();
    const message = customMessage || DEFAULT_MESSAGES[action](entity);
    setToasts((prev) => [...prev, { id, action, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-5 right-5 z-99999 space-y-3">
        {toasts.map((toast) => {
          const config = TOAST_CONFIG[toast.action];
          const Icon = config.icon;
          return (
            <div
              key={toast.id}
              className={`flex items-center gap-3 rounded-xl border p-4 shadow-theme-lg bg-white dark:bg-gray-900 ${config.border} min-w-[280px]`}
            >
              <Icon className={`w-6 h-6 shrink-0 ${config.color}`} />
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{toast.message}</p>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}