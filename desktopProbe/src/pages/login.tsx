import { DefaultLayout } from "./defaultLayout";
import { LoginCard } from "@/components/loginCard";

export function LoginPage() {
  return (
    <DefaultLayout className="flex justify-center items-center">
      <LoginCard />
    </DefaultLayout>
  );
}
