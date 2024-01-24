import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { JobSite } from "../../../supabase/functions/_shared/types";

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
  sites,
  onCreateLink,
}: {
  sites: JobSite[];
  onCreateLink: (params: { title: string; url: string }) => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      url: "",
    },
    mode: "onChange",
  });

  // Handler for form submission
  const onSubmit = (values: FormValues) => {
    if (!values.title || !values.url) return;
    onCreateLink({ title: values.title, url: values.url });
  };

  // JSX for rendering the form
  return (
    <section>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          {/* Form header */}
          <div>
            <FormLabel className="text-2xl font-medium tracking-wide">
              Add new job search
            </FormLabel>
            <FormDescription className="text-sm">
              Name your filtered job searches and provide their website. The
              more specific your filters, the better we can tailor job alerts
              for you. Add as many varied searches as you like to maximize your
              opportunities to be first in line.
              {sites.length > 0 && (
                <>
                  <br />
                  Available sites for searches include:{" "}
                  {sites.map((site, index) => (
                    <React.Fragment key={site.id}>
                      {site.name}
                      {index < sites.length - 1 ? ", " : ""}
                    </React.Fragment>
                  ))}
                </>
              )}
              .
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

          {/* Submit button */}
          <Button
            type="submit"
            className="mt-4"
            disabled={!form.formState.isValid}
          >
            Save
          </Button>
        </form>
      </Form>
    </section>
  );
}
