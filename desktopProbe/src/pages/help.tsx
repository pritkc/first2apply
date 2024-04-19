import { DefaultLayout } from "./defaultLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function HelpPage() {
  return (
    <DefaultLayout className="p-6 md:p-10 space-y-6 flex flex-col">
      <h1 className="text-2xl font-medium tracking-wide w-fit">FAQs</h1>

      <Accordion
        type="single"
        collapsible
        className="w-full border rounded-lg px-6"
      >
        <AccordionItem value="item-1" className="py-2">
          <AccordionTrigger className="text-lg font-normal hover:no-underline hover:text-primary">
            Why is this a desktop app and not a website?
          </AccordionTrigger>
          <AccordionContent className="text-base font-light">
            To maintain affordability for our users, the app is designed to
            utilize your device to refresh your saved job searches. This method
            helps us avoid the higher costs associated with using our own
            servers for this task.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2" className="py-2">
          <AccordionTrigger className="text-lg font-normal hover:no-underline hover:text-primary">
            Does the app automatically apply to jobs for me?
          </AccordionTrigger>
          <AccordionContent className="text-base font-light">
            No - the app does not apply to jobs on your behalf ... yet. We are
            planning to add this feature in the future, but for now, the app is
            designed to help you find more job opportunities.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3" className="py-2">
          <AccordionTrigger className="text-lg font-normal hover:no-underline hover:text-primary">
            Can it filter out jobs that I'm not interested in?
          </AccordionTrigger>
          <AccordionContent className="text-base font-light">
            Yes! LinkedIn can sometimes show you jobs that are not relevant to
            your search (even with the filters you set). With{" "}
            <b>Advanced Matching</b> the app allows you to filter out jobs based
            on keywords in job titles, companies or even the job description.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4" className="py-2">
          <AccordionTrigger className="text-lg font-normal hover:no-underline hover:text-primary">
            What happens if I close my computer?
          </AccordionTrigger>
          <AccordionContent className="text-base font-light">
            If you close your computer, the app will temporarily pause its job
            search operations. It will automatically reactivate and continue
            searching for new jobs once you power on your computer again. For
            uninterrupted service, we've included a setting in the app that can
            keep your computer awake while the app is in use.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-5" className="border-b-0 py-2">
          <AccordionTrigger className="text-lg font-normal hover:no-underline hover:text-primary">
            How will I see new job alerts when I'm not in front on my computer?
          </AccordionTrigger>
          <AccordionContent className="text-base font-light">
            Currently, the app delivers real-time desktop notifications to alert
            you about new job postings. We understand the importance of staying
            informed while away from your computer, and we are actively
            developing an email notification feature. This forthcoming update
            will ensure you receive timely job alerts, even when you're mobile.
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex justify-end items-center gap-4">
        <p className="text-base">
          Didn't find what you need? You can send us an email at{" "}
          <a
            href="mailto:contact@first2apply.com"
            className="underline text-primary"
          >
            contact@first2apply.com
          </a>
        </p>
      </div>
    </DefaultLayout>
  );
}
