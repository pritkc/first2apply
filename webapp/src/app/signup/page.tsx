"use client";

import { SignupCard } from "@/components/signupCard";
import { useError } from "@/hooks/error";
import { useSession } from "@/hooks/session";
import { signupWithEmail } from "@/lib/electronMainSdk";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Component used to render the signup page.
 */
export default function SignupPage() {
  const router = useRouter();
  const { login } = useSession();
  const { handleError } = useError();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSignupWithEmail = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    try {
      setIsSubmitting(true);
      const user = await signupWithEmail({ email, password });
      login(user);
      router.push("/");
    } catch (error) {
      handleError({ error });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center">
      <SignupCard
        onSignupWithEmail={onSignupWithEmail}
        isSubmitting={isSubmitting}
      />
    </main>
  );
}
