import { PricingOptions } from "@/components/pricingOptions";

const reason: "trial" | "payment" = "trial";

export function Subscription() {
  return (
    <main className="min-h-screen mx-auto w-full max-w-7xl p-6 md:p-10 flex flex-col justify-center">
      <h1 className="text-2xl sm:text-4xl lg:text-5xl font-semibold md:text-center">
        {reason === "trial"
          ? "Your 7 days trial has ended"
          : "Your subscription has ended"}
      </h1>
      <p className="mt-1 text-sm tracking-wide md:text-center">
        pick a plan to continue
      </p>
      <p className="mt-[3vh] sm:mt-[5vh] mb-3 text-center">Billing Period</p>

      <PricingOptions />
    </main>
  );
}
