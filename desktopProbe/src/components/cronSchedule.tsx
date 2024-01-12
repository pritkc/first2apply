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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const AVAILABLE_CRON_RULES = [
  {
    name: "Every 30 minutes",
    value: "*/30 * * * *",
  },
  {
    name: "Every hour",
    value: "0 * * * *",
  },
  {
    name: "Every 4 hours",
    value: "0 */4 * * *",
  },
  {
    name: "Every day",
    value: "0 0 * * *",
  },
  {
    name: "Every 3 days",
    value: "0 0 */3 * *",
  },
  {
    name: "Every week",
    value: "0 0 * * 0",
  },
];

const schema = z.object({
  cronRule: z.string().default(""),
});

/**
 * Component used to set the cron schedule of the probe.
 */
export function CronSchedule() {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: schema.parse({}),
  });

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="cronRule"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Search Frequency</FormLabel>
              <FormDescription>
                How often do you want to receive job notifications?
              </FormDescription>
            </div>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Never" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_CRON_RULES.map((rule) => (
                    <SelectItem key={rule.value} value={rule.value}>
                      {rule.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
          </FormItem>
        )}
      />
    </Form>
  );
}
