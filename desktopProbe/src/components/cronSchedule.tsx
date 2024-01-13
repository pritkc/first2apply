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
import { AVAILABLE_CRON_RULES, CronRule } from "@/lib/types";
import { useEffect, useState } from "react";
import {
  getProbeCronSchedule,
  updateProbeCronSchedule,
} from "@/lib/electronMainSdk";
import { getExceptionMessage } from "@/lib/error";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Switch } from "./ui/switch";

const schema = z.object({
  cronRule: z.string().default(""),
});

/**
 * Component used to set the cron schedule of the probe.
 */
export function CronSchedule({
  cronRule,
  onCronRuleChange,
}: {
  cronRule?: CronRule;
  onCronRuleChange: (cron: string | undefined) => void;
}) {
  return (
    <div className="space-y-4">
      {/* cron rule */}
      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <p className="text-base">Search Frequency</p>
          <span className="text-sm">
            How often do you want to receive job notifications?
          </span>
        </div>
        <Select value={cronRule?.value} onValueChange={onCronRuleChange}>
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
      </div>
    </div>
  );
}
