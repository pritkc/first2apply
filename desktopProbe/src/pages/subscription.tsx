import { PricingOptions } from "@/components/pricingOptions";
import {
  StripeBillingPlan,
  SubscriptionTier,
} from "../../../supabase/functions/_shared/types";

import { useError } from "@/hooks/error";
import { openExternalUrl } from "@/lib/electronMainSdk";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/session";
import { useEffect } from "react";

export function SubscriptionPage() {
  const { handleError } = useError();
  const {
    isLoading: isLoadingSession,
    profile,
    stripeConfig,
    refreshProfile,
  } = useSession();
  const isLoading = isLoadingSession || !profile || !stripeConfig;

  /**
   * Refresh the user profile every 5 seconds to check for subscription changes.
   */
  useEffect(() => {
    const interval = setInterval(() => {
      refreshProfile();
    }, 5000);

    return () => clearInterval(interval);
  }, [refreshProfile]);

  /**
   * Open the checkout page for the selected plan.
   */
  const handleSelectPlan = ({
    tier,
    billingCycle,
  }: {
    tier: SubscriptionTier;
    billingCycle: string;
  }) => {
    try {
      const stripePlan = stripeConfig.plans.find((p) => p.tier === tier);

      if (!stripePlan) {
        console.error(`Stripe plan not found for ${tier}`);
        return;
      }

      const checkoutLink =
        stripePlan[`${billingCycle}CheckoutLink` as keyof StripeBillingPlan];

      if (!checkoutLink) {
        console.error(`Checkout link not found for ${billingCycle}`);
        return;
      }

      openExternalUrl(checkoutLink);
    } catch (error) {
      handleError({ error, title: "Failed to open checkout page" });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <main className="min-h-screen mx-auto w-full max-w-7xl p-6 md:p-10 flex flex-col justify-center">
      {profile.is_trial ? (
        <>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-semibold md:text-center">
            Your 7 days trial has ended
          </h1>
          <p className="mt-1 text-sm tracking-wide md:text-center">
            pick a plan to continue
          </p>
          <p className="mt-[3vh] sm:mt-[5vh] mb-3 text-center">
            Billing Period
          </p>

          <PricingOptions onSelectPlan={handleSelectPlan} />
        </>
      ) : (
        <>
          {/* <h1 className="text-2xl sm:text-4xl lg:text-5xl font-semibold md:text-center">
            Your {profile.subscription_tier.toUpperCase()} plan has ended
          </h1> */}
          <Card className="mt-5">
            <CardHeader className="md:p-8">
              <CardTitle className="md:text-3xl">
                Your {profile.subscription_tier.toUpperCase()} plan has ended
              </CardTitle>
              <CardDescription></CardDescription>
            </CardHeader>
            <CardContent className="md:p-8 md:pt-2">
              <p>We hope you landed your dream job with First 2 Apply.</p>
              <p>
                Just in case you still need to use the app, you can renew your
                plan or switch to a different one.
              </p>
            </CardContent>
            <CardFooter className="md:p-8 md:pt-0 flex flex-col items-start">
              {/* CTA */}
              <Button
                size="lg"
                className="mt-10 self-center"
                onClick={() => openExternalUrl(stripeConfig.customerPortalLink)}
              >
                Manage Subscription
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </main>
  );
}
