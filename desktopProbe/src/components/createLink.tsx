import { Button } from "./ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "./ui/form";
import { Input } from "./ui/input";

const schema = z.object({
  title: z.string().min(1, { message: "This field cannot be blank" }).max(80),
  url: z.string().url().min(1, { message: "This field cannot be blank" }),
});

type FormValues = z.infer<typeof schema>;

export function CreateLink({
  onCreateLink,
}: {
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

  const onSubmit = (values: FormValues) => {
    if (!values.title || !values.url) return;
    onCreateLink({ title: values.title, url: values.url });
  };

  return (
    <section>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <div>
            <FormLabel className="text-2xl font-medium tracking-wide">
              Add new job search
            </FormLabel>
            <FormDescription className="text-sm">
              Name your filtered job searches and provide their website. The more
              specific your filters, the better we can tailor job alerts for
              you. Add as many varied searches as you like to maximize your
              opportunities to be first in line.
            </FormDescription>
          </div>

          <hr className="w-full text-muted-foreground" />

          <div className="flex flex-col w-full gap-2">
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
