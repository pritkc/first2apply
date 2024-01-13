import { useSession } from "@/hooks/session";
import { DefaultLayout } from "./defaultLayout";
import { LoginCard } from "@/components/loginCard";
import { useNavigate } from "react-router-dom";
import { loginWithEmail } from "@/lib/electronMainSdk";
import { useError } from "@/hooks/error";

/**
 * Component used to render the login page.
 */
export function LoginPage() {
  const { login } = useSession();
  const navigate = useNavigate();
  const { handleError } = useError();

  const onLoginWithEmail = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    try {
      const user = await loginWithEmail({ email, password });
      login(user);
      navigate("/");
    } catch (error) {
      handleError({ error });
    }
  };

  return (
    <DefaultLayout className="flex justify-center items-center">
      <LoginCard onLoginWithEmail={onLoginWithEmail} />
    </DefaultLayout>
  );
}
