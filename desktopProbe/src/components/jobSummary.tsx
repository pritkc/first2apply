import {
  BackpackIcon,
  CookieIcon,
  ListBulletIcon,
} from "@radix-ui/react-icons";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";

import { useSites } from "@/hooks/sites";
import { useEffect, useState } from "react";
import {
  JOB_LABELS,
  Job,
  JobLabel,
} from "../../../supabase/functions/_shared/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useToast } from "./ui/use-toast";

const LABEL_COLOR_CLASSES = {
  [JOB_LABELS.CONSIDERING]: "bg-blue-500",
  [JOB_LABELS.SUBMITTED]: "bg-green-500",
  [JOB_LABELS.INTERVIEWING]: "bg-yellow-500",
  [JOB_LABELS.OFFER]: "bg-purple-500",
  [JOB_LABELS.REJECTED]: "bg-red-500",
  empty: "",
};

function isJobLabel(value: any): value is JobLabel {
  return Object.values(JOB_LABELS).includes(value);
}

/**
 * Component to display the details of a job.
 */
export function JobSummary({
  job,
  onApply,
  onArchive,
  onUpdateJobLabel,
}: {
  job: Job;
  onApply: (job: Job) => void;
  onArchive: (job: Job) => void;
  onUpdateJobLabel: (jobId: number, label: JobLabel | "") => void;
}) {
  const { toast } = useToast();

  const [label, setLabel] = useState<JobLabel | "">("");

  useEffect(() => {
    const labelValue = job.labels?.[0] ?? "";
    setLabel(labelValue);
  }, [job]);

  const validateAndSetLabel = (labelValue: string) => {
    // When the user removes the label
    if (labelValue === "empty") {
      onUpdateJobLabel(job.id, "");
      // Empty string means no label, used instead of undefined because otherwise it won't update the select re render
      setLabel("");
      return;
    }

    const isValid = isJobLabel(labelValue);
    if (!isValid) {
      toast({
        title: "Error",
        description: `Invalid job label selected! ${labelValue}`,
        variant: "destructive",
      });
      return;
    }

    onUpdateJobLabel(job.id, labelValue);
    setLabel(labelValue);
  };

  return (
    <div className="border border-muted rounded-lg p-4 lg:p-6">
      <div className="flex justify-between items-start gap-4 lg:gap-6">
        <div>
          <h1 className="text-xl font-medium mt-3 lg:mt-4">{job.title}</h1>

          <p className="text-sm text-muted-foreground">
            {job.companyName}
            {job.location && (
              <span>
                {" · "}
                {job.location}
              </span>
            )}
          </p>
        </div>
        {job.companyLogo && (
          <Avatar className="w-16 h-16">
            <AvatarImage src={job.companyLogo} />
            <AvatarFallback>LI</AvatarFallback>
          </Avatar>
        )}
      </div>

      <div className="space-y-1.5 mt-3 lg:mt-4">
        {job.jobType && (
          <div className="flex gap-3 items-center text-muted-foreground capitalize">
            <BackpackIcon className="w-5 h-auto" />
            {job.jobType}
          </div>
        )}
        {job.salary && (
          <div className="flex gap-3 items-center text-muted-foreground">
            <CookieIcon className="w-5 h-auto" />
            {job.salary}
          </div>
        )}
        {job.tags && (
          <div className="flex gap-3 items-center text-muted-foreground">
            <ListBulletIcon className="w-5 h-auto" />
            <p>
              {"Skills: "}
              {job.tags?.slice(0, 5).join(", ")}
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-4 lg:mt-6">
        {job.status !== "applied" && (
          <Button
            size="lg"
            className="w-24 text-sm"
            onClick={() => {
              onApply(job);
            }}
          >
            Apply
          </Button>
        )}
        {job.status !== "archived" && (
          <Button
            size="lg"
            variant="outline"
            className="w-24 text-sm"
            onClick={() => {
              onArchive(job);
            }}
          >
            Archive
          </Button>
        )}

        {job.status === "applied" && (
          <Select
            // For now we use only the first one as there should be only one label per job
            value={label}
            onValueChange={(labelValue) => validateAndSetLabel(labelValue)}
          >
            <SelectTrigger
              className={`w-[180px] ${
                label && LABEL_COLOR_CLASSES[label]
              } bg-opacity-70 `}
            >
              <SelectValue placeholder="Add Label" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(JOB_LABELS).map((jobLabel) => (
                <SelectItem
                  key={jobLabel}
                  value={jobLabel}
                  className={`${LABEL_COLOR_CLASSES[jobLabel]} bg-opacity-70`}
                >
                  {jobLabel}
                </SelectItem>
              ))}

              {/* Remove a lable only if there is one */}
              {job.labels?.[0] && (
                // Need to assing an actual value, can't use an empty string
                <SelectItem
                  value={"empty"}
                  className={`bg-gray-500 bg-opacity-70`}
                >
                  Remove Label
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
