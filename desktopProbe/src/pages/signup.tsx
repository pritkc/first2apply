import { useState } from "react";
import { useError } from "@/hooks/error";
import { useSession } from "@/hooks/session";
import { useNavigate } from "react-router-dom";

import { signupWithEmail } from "@/lib/electronMainSdk";

import { DefaultLayout } from "./defaultLayout";
import { SignupCard } from "@/components/signupCard";

/**
 * Component used to render the signup page.
 */
export function SignupPage() {
  const navigate = useNavigate();
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
      navigate("/");
    } catch (error) {
      handleError({ error });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DefaultLayout className="flex justify-center items-center" isNavbarHidden>
      <SignupCard
        onSignupWithEmail={onSignupWithEmail}
        isSubmitting={isSubmitting}
      />
    </DefaultLayout>
  );
}
