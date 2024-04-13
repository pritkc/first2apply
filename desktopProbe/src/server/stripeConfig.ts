import { StripeConfig } from "../../../supabase/functions/_shared/types";

const devConfig: StripeConfig = {
  customerPortalLink:
    "https://billing.stripe.com/p/login/test_3csbLi9tW6AH48wfYY",
  plans: [
    {
      tier: "basic",
      monthlyCheckoutLink: "https://buy.stripe.com/test_4gwdTQfF44jdf726oo",
      quarterlyCheckoutLink: "https://buy.stripe.com/test_9AQ6ro8cC1712kgdQR",
      biannuallyCheckoutLink: "https://buy.stripe.com/test_dR66ro1Oe4jdbUQ8wy",
      yearlyCheckoutLink: "https://buy.stripe.com/test_5kA8zweB0g1V6AwbIL",
    },
    {
      tier: "pro",
      monthlyCheckoutLink: "https://buy.stripe.com/test_aEUcPM2Si8zt6AwfZ2",
      quarterlyCheckoutLink: "https://buy.stripe.com/test_bIY5nk8cC9Dxgb68wC",
      biannuallyCheckoutLink: "https://buy.stripe.com/test_5kA030eB03f98IEdQV",
      yearlyCheckoutLink: "https://buy.stripe.com/test_bIYg1Y78yaHB2kg4gn",
    },
  ],
};

// @ts-ignore
const prodConfig: StripeConfig = {};

export function getStripeConfig(nodeEnv: string) {
  return nodeEnv === "production" ? prodConfig : devConfig;
}
