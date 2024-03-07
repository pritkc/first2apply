import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Job } from "../../../supabase/functions/_shared/types";

/**
 * Component to display the details of a job.
 */
export function JobDetails({ job }: { job: Job }) {
  return (
    <div className="space-y-4 lg:space-y-5">
      <Markdown
        remarkPlugins={[remarkGfm]}
        className="job-description-md pl-[25px] pr-2"
      >
        {job.description}
      </Markdown>
    </div>
  );
}
