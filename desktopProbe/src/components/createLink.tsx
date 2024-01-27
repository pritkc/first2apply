import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSites } from "@/hooks/sites";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { openExternalUrl } from "@/lib/electronMainSdk";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "./ui/form";

// Schema definition for form validation using Zod
const schema = z.object({
  title: z.string().min(1, { message: "This field cannot be blank" }).max(80),
  url: z.string().url().min(1, { message: "This field cannot be blank" }),
});

// Types for form values
type FormValues = z.infer<typeof schema>;

export function CreateLink({
  onCreateLink,
}: {
  onCreateLink: (params: { title: string; url: string }) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      url: "",
    },
    mode: "onChange",
  });

  // Handler for form submission
  const onSubmit = async (values: FormValues) => {
    if (!values.title || !values.url) return;
    // Start loading
    setIsSubmitting(true);

    try {
      await onCreateLink({ title: values.title, url: values.url });
      // Reset form on success
      form.reset();
    } catch (error) {
      console.error("Error creating link:", error);
    } finally {
      // Stop loading regardless of outcome
      setIsSubmitting(false);
    }
  };

  const { sites } = useSites();

  // JSX for rendering the form
  return (
    <section className="p-6 border border-[#809966]/30 rounded-lg">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          {/* Form header */}
          <div className="space-y-1">
            <FormLabel className="text-2xl font-medium tracking-wide">
              Add new job search
            </FormLabel>
            <FormDescription className="text-sm space-y-3">
              <p>
                Name your filtered job searches and provide their website. The
                more specific your filters, the better we can tailor job alerts
                for you.
                <br />
                Add as many varied searches as you like to maximize your
                opportunities to be first in line.
              </p>
              {sites.length > 0 && (
                <p>
                  Available sites for searches include:{" "}
                  {sites.map((site, index) => (
                    <span key={site.id} className="text-ring">
                      <button
                        onClick={() => {
                          openExternalUrl(site.urls[0]);
                        }}
                      >
                        {site.name}
                      </button>
                      {index < sites.length - 1 ? ", " : "."}
                    </span>
                  ))}
                </p>
              )}
            </FormDescription>
          </div>
          <hr className="w-full text-muted-foreground" />
          {/* Form fields */}
          <div className="flex flex-col w-full gap-2">
            {/* Title field */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      id="title"
                      type="title"
                      placeholder="Enter a descriptive name (eg: java senior remote)"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* URL field */}
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input
                      id="url"
                      type="url"
                      placeholder="Paste the URL of your job search"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="flex flex-row justify-between items-center pt-4">
            <h2 className="text-sm animate-pulse">
              <span className="px-2 py-0.5 ring-[1px] ring-ring rounded-full mr-2">
                i
              </span>
              Make sure to apply the 'Last 24 Hours' filter where possible.
            </h2>
            {/* Submit button */}
            <Button
              type="submit"
              disabled={!form.formState.isValid || isSubmitting}
              className="w-28 flex justify-center items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white flex justify-center"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </section>
  );
}
