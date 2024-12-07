"use client";

import { LoginCard } from "@/components/loginCard";
import { useError } from "@/hooks/error";
import { useSession } from "@/hooks/session";
import { loginWithEmail } from "@/lib/electronMainSdk";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Component used to render the login page.
 */
export default function LoginPage() {
  const { login } = useSession();
  const router = useRouter();
  const { handleError } = useError();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onLoginWithEmail = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    try {
      setIsSubmitting(true);
      const user = await loginWithEmail({ email, password });
      await login(user);
      router.push("/");
    } catch (error) {
      handleError({ error });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LoginCard
      onLoginWithEmail={onLoginWithEmail}
      isSubmitting={isSubmitting}
    />
  );
}
