import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useError } from '@/hooks/error';
import { useLinks } from '@/hooks/links';
import { useSites } from '@/hooks/sites';
import { openExternalUrl } from '@/lib/electronMainSdk';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Icons } from './icons';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from './ui/form';
import { Input } from './ui/input';

// Schema definition for form validation using Zod
const schema = z.object({
  title: z.string().min(1, { message: 'This field cannot be blank' }).max(80),
  url: z.string().url().min(1, { message: 'This field cannot be blank' }),
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
  const sortedSites = sites
    .sort((a, b) => a.name.localeCompare(b.name))
    // also filter out deprecated sites
    .filter((site) => site.deprecated === false);

  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      url: '',
    },
    mode: 'onChange',
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
        title: 'Success',
        description: 'Job search saved successfully! We are scanning the site for new jobs in the background.',
        variant: 'success',
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
        <Button variant="default" size="lg" className="px-10 text-base">
          Add Search
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium tracking-wide">Add new job search</DialogTitle>
          <DialogDescription>
            Go to one of your favorite websites and search for a job. The more specific your filters, the better we can
            tailor job alerts for you.
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
                      <Input id="url" type="url" placeholder="Paste the URL of your job search" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-row items-center justify-between pt-3">
              {/* Submit button */}
              <Button
                type="submit"
                disabled={!form.formState.isValid || isSubmitting}
                className="ml-auto flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Icons.spinner2 className="h-4 w-4 animate-spin" />
                    Scanning site...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </form>
        </Form>

        <h2 className="mt-6 text-base tracking-wide">Supported job boards:</h2>
        <DialogFooter>
          <ul className="flex w-full flex-wrap justify-evenly gap-1.5">
            {sortedSites.map((site) => (
              <li key={site.id}>
                <Badge
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
