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
import { AVAILABLE_CRON_RULES } from "@/lib/types";
import { useEffect } from "react";
import {
  getProbeCronSchedule,
  updateProbeCronSchedule,
} from "@/lib/electronMainSdk";
import { getExceptionMessage } from "@/lib/error";

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
    mode: "onChange",
  });

  // load cron rule when component is mounted
  useEffect(() => {
    const loadCronRule = async () => {
      try {
        const cronRule = await getProbeCronSchedule();
        form.setValue("cronRule", cronRule.value);
      } catch (error) {
        console.error(getExceptionMessage(error));
      }
    };
    loadCronRule();
  }, []);

  // update cron rule when form is updated
  const saveCronRule = async (data: z.infer<typeof schema>) => {
    try {
      const cronRule = AVAILABLE_CRON_RULES.find(
        (cr) => cr.value === data.cronRule
      );
      await updateProbeCronSchedule({ cronRule });
    } catch (error) {
      console.error(getExceptionMessage(error));
    }
  };

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
              <Select
                value={field.value}
                onValueChange={(evt) => {
                  field.onChange(evt);
                  saveCronRule(form.getValues());
                }}
              >
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
