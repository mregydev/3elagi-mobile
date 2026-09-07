import React, { useCallback, useEffect, useState } from "react";
import { AppErrorFallback } from "@/components/AppErrorBoundary";

type GlobalErrorState = {
  error: Error;
  retry?: () => void;
};

function toError(value: unknown): Error {
  if (value instanceof Error) return value;
  if (typeof value === "string") return new Error(value);
  return new Error("Unknown client error");
}

/** Catches window errors and unhandled promise rejections outside the React tree. */
export function GlobalClientErrorHandler({ children }: { children: React.ReactNode }) {
  const [globalError, setGlobalError] = useState<GlobalErrorState | null>(null);

  const clearError = useCallback(() => {
    setGlobalError(null);
  }, []);

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      setGlobalError({
        error: toError(event.error ?? event.message),
        retry: () => {
          clearError();
          window.location.reload();
        },
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      setGlobalError({
        error: toError(event.reason),
        retry: () => {
          clearError();
          window.location.reload();
        },
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, [clearError]);

  if (globalError) {
    return (
      <AppErrorFallback
        error={globalError.error}
        retry={globalError.retry ?? clearError}
      />
    );
  }

  return <>{children}</>;
}
