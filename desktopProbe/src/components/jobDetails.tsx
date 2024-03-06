import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Job } from "../../../supabase/functions/_shared/types";

/**
 * Component to display the details of a job.
 */
export function JobDetails({ job }: { job: Job }) {
  return (
    <div>
      <h1>{job.title}</h1>

      <Markdown remarkPlugins={[remarkGfm]} className="job-description-md">
        {job.description}
      </Markdown>

      {/* {job.tags && (
        <div className="flex flex-wrap gap-1.5 pl-2 mt-3">
          {job.tags?.slice(0, 5).map((tag, idx) => (
            <Badge key={idx} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      )} */}
    </div>
  );
}
