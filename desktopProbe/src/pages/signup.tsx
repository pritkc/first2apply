import { DefaultLayout } from "./defaultLayout";
import { LoginCard } from "@/components/loginCard";

export function SignupPage() {
  return (
    <DefaultLayout className="flex justify-center items-center">
      <LoginCard />
    </DefaultLayout>
  );
}
