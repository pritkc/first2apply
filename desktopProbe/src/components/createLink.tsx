import { useState } from "react";

import { useError } from "@/hooks/error";
import { useLinks } from "@/hooks/links";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "./ui/button";
import { Icons } from "./icons";
import { Input } from "./ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "./ui/form";
import { useSites } from "@/hooks/sites";
import { openExternalUrl } from "@/lib/electronMainSdk";
import { Badge } from "./ui/badge";

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
  const { sites } = useSites();
  const { toast } = useToast();

  // sort sites by name
  const sortedSites = sites.sort((a, b) => a.name.localeCompare(b.name));

  const [isOpen, setIsOpen] = useState(false);
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

      // Close the dialog
      setIsOpen(false);
    } catch (error) {
      handleError({ error });
    } finally {
      // Stop loading regardless of outcome
      setIsSubmitting(false);
    }
  };

  // JSX for rendering the form
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="lg" className="text-base px-10">
          Add Search
        </Button>
      </DialogTrigger>
      <DialogContent className="p-6 max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium tracking-wide">
            Add new job search
          </DialogTitle>
          <DialogDescription>
            Go to one of your favorite websites and search for a job. The more
            specific your filters, the better we can tailor job alerts for you.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
            {/* Form fields */}
            <div className="flex flex-col gap-3">
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

            <div className="flex flex-row justify-between items-center pt-3">
              {/* Submit button */}
              <Button
                type="submit"
                disabled={!form.formState.isValid || isSubmitting}
                className="flex justify-center items-center gap-2 ml-auto"
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

        <h2 className="text-base tracking-wide mt-6">Supported job boards:</h2>
        <DialogFooter>
          <ul className="w-full flex gap-1.5 flex-wrap justify-evenly">
            {sortedSites.map((site) => (
              <li key={site.id}>
                <Badge
                  variant="secondary"
                  // className="text-[#738a5c] dark:text-ring text-center"
                  onClick={() => {
                    openExternalUrl(site.urls[0]);
                  }}
                >
                  {site.name}
                </Badge>
              </li>
            ))}
          </ul>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
