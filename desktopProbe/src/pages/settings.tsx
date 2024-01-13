import { LinksList } from "@/components/linksList";
import { DefaultLayout } from "./defaultLayout";
import { useEffect, useState } from "react";
import { useError } from "@/hooks/error";
import { Link } from "../../../supabase/functions/_shared/types";
import { listLinks } from "@/lib/electronMainSdk";
import { Switch } from "@/components/ui/switch";

export function SettingsPage() {
  return (
    <DefaultLayout className="p-6 md:p-10 xl:px-0">
      {/* sleep settings */}
      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <p className="text-base">Prevent computer from entering sleep</p>
          <span className="text-sm">
            First2Apply needs to run in the background to notify you of new jobs
          </span>
        </div>
        <Switch />
      </div>

      {/* sleep settings */}
      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <p className="text-base">Enable notification sounds</p>
          <span className="text-sm">
            Play a sound when a new job is found in order to get your attention
          </span>
        </div>
        <Switch />
      </div>

      {/* email notifications */}
      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <p className="text-base">Email notifications coming soon</p>
          <span className="text-sm">
            Get notified of new jobs even when you are on the go
          </span>
        </div>
        <Switch disabled value={""} />
      </div>
    </DefaultLayout>
  );
}
