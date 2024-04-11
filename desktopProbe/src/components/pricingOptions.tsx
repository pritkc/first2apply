import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircledIcon } from "@radix-ui/react-icons";
import { Button } from "./ui/button";

const tabs = ["Monthly", "Quarterly", "Biannually", "Yearly"];

type PriceDetail = {
  pricePerMonth: number;
  total: number;
  discount: number;
  period: number;
};

type PricingPlan = {
  name: string;
  description?: string;
  monthly: PriceDetail;
  quarterly: PriceDetail;
  biannually: PriceDetail;
  yearly: PriceDetail;
  benefits: string[];
};

const pricingPlans: PricingPlan[] = [
  {
    name: "Basic",
    description: "Cheap as a beer",
    monthly: { pricePerMonth: 5, total: 5, discount: 0, period: 1 },
    quarterly: { pricePerMonth: 3.75, total: 11.25, discount: 0.25, period: 3 },
    biannually: { pricePerMonth: 3.25, total: 19.5, discount: 0.35, period: 6 },
    yearly: { pricePerMonth: 2.5, total: 30, discount: 0.5, period: 12 },
    benefits: [
      "Unlimited job site monitoring.",
      "Instant new job alerts.",
      "Application organization.",
    ],
  },
  {
    name: "Pro",
    description: "All you need to get hired",
    monthly: { pricePerMonth: 10, total: 10, discount: 0, period: 1 },
    quarterly: { pricePerMonth: 7.5, total: 22.5, discount: 0.25, period: 3 },
    biannually: { pricePerMonth: 6.5, total: 39, discount: 0.35, period: 6 },
    yearly: { pricePerMonth: 5, total: 60, discount: 0.5, period: 12 },
    benefits: [
      "Everything the basic plan offers.",
      "Blacklist companies.",
      "Advanced filtering.",
    ],
  },
];

export function PricingOptions() {
  const [selectedTab, setSelectedTab] = useState(tabs[0]);

  return (
    <Tabs defaultValue={tabs[0]} className="flex flex-col items-center">
      <TabsList className="w-fit">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab}
            value={tab}
            onClick={() => {
              setSelectedTab(tab);
              console.log(tab);
            }}
          >
            {tab}
          </TabsTrigger>
        ))}
      </TabsList>
      <div className="mt-[5vh] sm:mt-[10vh] w-full grid sm:grid-cols-2 gap-6 md:gap-10 lg:gap-20">
        {pricingPlans.map((plan) => (
          <Card key={plan.name} className="relative overflow-hidden">
            <CardHeader className="md:p-8">
              <CardTitle className="md:text-3xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="md:p-8 md:pt-2">
              <p>
                <span className="text-2xl md:text-3xl font-semibold">$</span>
                <span className="text-4xl md:text-5xl font-bold">
                  {
                    (
                      plan[
                        selectedTab.toLowerCase() as keyof PricingPlan
                      ] as PriceDetail
                    ).pricePerMonth
                  }
                </span>
                <span className="text-sm"> /month</span>
                {selectedTab !== "Monthly" && (
                  <div className="ml-4 inline-block relative">
                    <span className="text-2xl md:text-3xl text-muted-foreground/30 font-semibold">
                      $
                    </span>
                    <span className="text-4xl md:text-5xl text-muted-foreground/30 font-bold">
                      {plan.monthly.pricePerMonth}
                    </span>
                    <span className="text-sm text-muted-foreground/30">
                      /month
                    </span>
                    <div className="absolute top-5 md:top-7 w-full border border-t-1 border-muted-foreground/30 dark:border-muted-foreground/60 rotate-12"></div>
                  </div>
                )}
              </p>
              <p className="mt-1 sm:mt-2 h-6 text-muted-foreground">
                {selectedTab !== "Monthly" && (
                  <>
                    Pay $
                    {
                      (
                        plan[
                          selectedTab.toLowerCase() as keyof PricingPlan
                        ] as PriceDetail
                      ).total
                    }{" "}
                    {selectedTab.toLowerCase()}
                  </>
                )}
              </p>
            </CardContent>
            <CardFooter className="md:p-8 md:pt-0 flex flex-col items-start">
              <ul>
                {plan.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircledIcon className="w-5 h-5 text-primary" />
                    <span className="md:text-lg">{benefit}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                size="lg"
                className="mt-10 w-40 self-center"
                disabled={plan.name === "Pro"}
              >
                Select
              </Button>
            </CardFooter>

            {plan.name === "Pro" && (
              <div className="absolute top-12 -right-2 bg-primary text-background sm:text-lg font-medium py-1 sm:py-2 px-20 transform rotate-45 translate-x-1/4 -translate-y-1/4">
                Coming Soon
              </div>
            )}
          </Card>
        ))}
      </div>
    </Tabs>
  );
}
