import { DefaultLayout } from "@/components/defaultLayout";
import { ProductSection } from "@/components/productSection";
import { ExplainerSection } from "@/components/explainerSection";
import { BenefitsSection } from "@/components/benefitsSection";
import { AlertsSection } from "@/components/alertsSection";
import { OrganizationSection } from "@/components/organizationSection";
import { AdvancedMatchingSection } from "@/components/advancedMatchingSection";
import { FeedbackSection } from "@/components/feedbackSection";
import { PricingSection } from "@/components/pricingSection";
import { Faqs } from "@/components/faqs";

export default function Home() {
  return (
    <DefaultLayout>
      <ProductSection />
      <ExplainerSection />
      <FeedbackSection />
      <BenefitsSection />
      <AlertsSection />
      <OrganizationSection />
      <AdvancedMatchingSection />
      <PricingSection />
      <Faqs />
    </DefaultLayout>
  );
}
