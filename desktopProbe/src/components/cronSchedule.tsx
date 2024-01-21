import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { AVAILABLE_CRON_RULES } from "@/lib/types";

/**
 * Component used to set the cron schedule of the probe.
 */
export function CronSchedule({
  cronRule,
  onCronRuleChange,
}: {
  cronRule?: string;
  onCronRuleChange: (cron: string | undefined) => void;
}) {
  return (
    <div className="space-y-4">
      {/* cron rule */}
      <div className="flex flex-row items-center justify-between rounded-lg border border-[#809966]/40 gap-6 p-4">
        <div className="space-y-0.5">
          <p className="text-base">Search Frequency</p>
          <span className="text-sm">
            How often do you want to receive job notifications?
          </span>
        </div>
        <Select value={cronRule} onValueChange={onCronRuleChange}>
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
