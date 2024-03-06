import { useState } from "react";

import { useError } from "@/hooks/error";
import { useLinks } from "@/hooks/links";
import { useToast } from "@/components/ui/use-toast";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "./ui/button";
import { Icons } from "./icons";
import { Input } from "./ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "./ui/form";

// Schema definition for form validation using Zod
const schema = z.object({
  title: z.string().min(1, { message: "This field cannot be blank" }).max(80),
  url: z.string().url().min(1, { message: "This field cannot be blank" }),
});

// Types for form values
type FormValues = z.infer<typeof schema>;

export function CreateLink() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { handleError } = useError();
  const { createLink } = useLinks();

  const { toast } = useToast();

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

    setIsSubmitting(true);

    try {
      await createLink({ title: values.title, url: values.url });
      // Reset form and stop submitting only if creation is successful
      form.reset();
      toast({
        title: "Success",
        description: "Job search saved successfully!",
        variant: "success",
      });
    } catch (error) {
      handleError({ error });
    } finally {
      // Stop loading regardless of outcome
      setIsSubmitting(false);
    }
  };

  // JSX for rendering the form
  return (
    <section className="p-6 border border-[#809966]/30 rounded-lg">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
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
            {/* Submit button */}
            <Button
              type="submit"
              disabled={!form.formState.isValid || isSubmitting}
              className="flex justify-center items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Icons.spinner2 className="animate-spin h-4 w-4" />
                  Scanning site...
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
