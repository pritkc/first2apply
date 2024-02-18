import { useNavigate } from "react-router-dom";
import { changePassword } from "@/lib/electronMainSdk";
import { useError } from "@/hooks/error";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ResetPasswordCard } from "@/components/resetPasswordCard";
import { useSession } from "@/hooks/session";

/**
 * Component used to render the reset password page.
 */
export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { login } = useSession();
  const { toast } = useToast();
  const { handleError } = useError();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordChange = async ({ password }: { password: string }) => {
    try {
      setIsSubmitting(true);
      const user = await changePassword({ password });
      login(user);
      toast({
        title: "Password changed",
        description:
          "Your password has been changed successfully, you can use it to login next time.",
        variant: "success",
      });
      navigate("/");
    } catch (error) {
      handleError({ error });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex justify-center items-center min-h-screen">
      <ResetPasswordCard
        onChangePassword={handlePasswordChange}
        isSubmitting={isSubmitting}
      />
    </main>
  );
}
