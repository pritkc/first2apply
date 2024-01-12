import { DefaultLayout } from "./defaultLayout";
import { SignupCard } from "@/components/signupCard";

export function SignupPage() {
  return (
    <DefaultLayout className="flex justify-center items-center">
      <SignupCard />
    </DefaultLayout>
  );
}
