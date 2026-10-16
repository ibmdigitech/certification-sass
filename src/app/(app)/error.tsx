"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <ErrorState
      title="Application Error"
      description={error.message || "An unexpected error occurred. The page will reload automatically."}
      onRetry={reset}
    />
  );
}