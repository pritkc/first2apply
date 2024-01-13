import { Button } from "./ui/button";
import { PlusCircledIcon } from "@radix-ui/react-icons";
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
    <section className="h-fit border border-muted-foreground/20 rounded-lg">
      <div className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-0.5">
              <FormLabel className="text-base">Add new job search</FormLabel>
              <FormDescription>
                Enter a descriptive name for your search
              </FormDescription>
            </div>

            <div className="flex flex-col gap-1">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl className="flex gap-2">
                      <>
                        <Input
                          id="title"
                          type="title"
                          placeholder="Enter a descriptive name (eg: java senior remote)"
                          {...field}
                        />
                      </>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl className="flex gap-2">
                      <>
                        <Input
                          id="url"
                          type="url"
                          placeholder="Paste the URL of your job search"
                          {...field}
                        />
                      </>
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
      </div>
    </section>
  );
}
