import { useToast } from "@/components/ui/use-toast";
import { getExceptionMessage } from "@/lib/error";
import { useState } from "react";

/**
 * Hook used to handle errors.
 */
export function useError() {
  const { toast } = useToast();

  const [error, setError] = useState<unknown>(null);

  const handleError = ({
    error,
    title = "Oops, something went wrong!",
  }: {
    error: unknown;
    title?: string;
  }) => {
    console.error(getExceptionMessage(error));
    toast({
      title,
      description: getExceptionMessage(error, true),
      variant: "destructive",
    });
  };

  const resetError = () => {
    setError(null);
  };

  return { error, handleError, resetError };
}
