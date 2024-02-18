import { sendPasswordResetEmail } from "@/lib/electronMainSdk";
import { useError } from "@/hooks/error";
import { ForgotPasswordCard } from "@/components/forgotPasswordCard";
import { useState } from "react";

import { useToast } from "@/components/ui/use-toast";

/**
 * Component used to render the forgot password card.
 */
export function ForgotPasswordPage() {
  const { toast } = useToast();
  const { handleError } = useError();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetPasswordRequest = async ({ email }: { email: string }) => {
    try {
      setIsSubmitting(true);
      await sendPasswordResetEmail({ email });
      toast({
        title: "Reset password email sent",
        description: `An email has been sent to ${email} with a link to reset your password.`,
        variant: "success",
      });
    } catch (error) {
      handleError({ error });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex justify-center items-center min-h-screen">
      <ForgotPasswordCard
        onResetPassword={resetPasswordRequest}
        isSubmitting={isSubmitting}
      />
    </main>
  );
}
