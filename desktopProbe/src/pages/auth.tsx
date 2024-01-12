import { SignupCard } from "@/components/signupCard";
import { DefaultLayout } from "./defaultLayout";

export function AuthPage() {
  return (
    <DefaultLayout>
      <div className="flex justify-center ">
        <SignupCard />
      </div>
    </DefaultLayout>
  );
}
