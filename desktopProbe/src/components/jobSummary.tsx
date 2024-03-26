import {
  BackpackIcon,
  CookieIcon,
  ListBulletIcon,
  ExternalLinkIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";

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

import { LABEL_COLOR_CLASSES } from "@/lib/labels";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

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
  onDelete,
  onUpdateLabels,
  onView,
}: {
  job: Job;
  onApply: (job: Job) => void;
  onArchive: (job: Job) => void;
  onDelete: (job: Job) => void;
  onUpdateLabels: (jobId: number, labels: JobLabel[]) => void;
  onView: (job: Job) => void;
}) {
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

      <div className="flex flex-wrap gap-2 mt-6 lg:mt-10">
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
            variant="secondary"
            className="w-24 text-sm"
            onClick={() => {
              onArchive(job);
            }}
          >
            Archive
          </Button>
        )}

        <Button
          size="lg"
          variant="secondary"
          className="w-10 px-0 border-none bg-border hover:bg-foreground/20 focus:bg-foreground/20 transition-colors duration-200 ease-in-out"
          onClick={() => onView(job)}
        >
          <ExternalLinkIcon className="h-4 w-auto" />
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="lg"
              variant="destructive"
              className="w-10 px-0 bg-destructive/10 hover:bg-destructive/20 focus:bg-destructive/20 transition-colors duration-200 ease-in-out"
            >
              <TrashIcon className="h-5 w-auto text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Are you sure you want to delete this job?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this
                job and you won't be able to see it again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={() => onDelete(job)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="lg:ml-auto">
          <JobLabelSelector job={job} onUpdateLabels={onUpdateLabels} />
        </div>
      </div>
    </div>
  );
}

/**
 * Component used to render a label selector.
 * For now we only allow setting one label per job.
 */
function JobLabelSelector({
  job,
  onUpdateLabels,
}: {
  job: Job;
  onUpdateLabels: (jobId: number, labels: JobLabel[]) => void;
}) {
  const label = job.labels[0] ?? "";
  console.log("label", label ?? "none");

  const LabelOptionWithColor = ({
    jobLabel,
    colorClass,
  }: {
    jobLabel: string;
    colorClass: string;
  }) => (
    <SelectItem value={jobLabel}>
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full ${colorClass}`}></div>
        <div className="flex-1 ml-2">{jobLabel}</div>
      </div>
    </SelectItem>
  );

  return (
    <Select
      value={label}
      onValueChange={(labelValue) => {
        const newLabels = isJobLabel(labelValue) ? [labelValue] : [];
        onUpdateLabels(job.id, newLabels);
      }}
    >
      <SelectTrigger className="w-[148px] h-10">
        <SelectValue placeholder="Add Label" />
      </SelectTrigger>
      <SelectContent>
        {/* no label */}
        <LabelOptionWithColor jobLabel="None" colorClass="bg-background" />

        {/* labels with colors */}
        {Object.values(JOB_LABELS).map((jobLabel) => (
          <LabelOptionWithColor
            key={jobLabel}
            jobLabel={jobLabel}
            colorClass={LABEL_COLOR_CLASSES[jobLabel]}
          />
        ))}
      </SelectContent>
    </Select>
  );
}
