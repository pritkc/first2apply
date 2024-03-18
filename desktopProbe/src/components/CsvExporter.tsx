import { Button } from "@/components/ui/button";
import { useToast } from "./ui/use-toast";
import { useError } from "../hooks/error";
import { exportJobsToCsv } from "@/lib/electronMainSdk";
import { Job } from "../../../supabase/functions/_shared/types";

export function CsvExporter({ jobs }: { jobs: Job[] }) {
  const { toast } = useToast();
  const { handleError } = useError();

  const handleExport = async () => {
    try {
      const fileName = await exportJobsToCsv(jobs);
      if (!fileName) return;
      toast({
        title: "Success",
        description: `File ${fileName} has been exported successfully.`,
        variant: "success",
      });
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <div className="my-2">
      <Button disabled={!jobs.length} onClick={handleExport}>
        Export CSV
      </Button>
    </div>
  );
}
