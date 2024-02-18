import { JobScannerSettings } from "@/lib/types";

import { useError } from "@/hooks/error";
import { useSession } from "@/hooks/session";
import { useSettings } from "@/hooks/settings";

import { SettingsSkeleton } from "@/components/skeletons/SettingsSkeleton";
import { DefaultLayout } from "./defaultLayout";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

import { logout } from "@/lib/electronMainSdk";

export function SettingsPage() {
  const { handleError } = useError();
  const { logout: resetUser, user } = useSession();
  const { isLoading, settings, updateSettings } = useSettings();

  // Update settings
  const onUpdatedSettings = async (newSettings: JobScannerSettings) => {
    try {
      await updateSettings(newSettings);
    } catch (error) {
      handleError({ error });
    }
  };

  // Logout
  const onLogout = async () => {
    try {
      await logout();
      resetUser();
    } catch (error) {
      handleError({ error });
    }
  };

  if (isLoading) {
    return (
      <DefaultLayout className="p-6 md:p-10 space-y-3">
        <SettingsSkeleton />
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout className="p-6 md:p-10 space-y-3">
      <h1 className="text-2xl font-medium tracking-wide pb-3 w-fit">
        Settings ({user.email})
      </h1>
      {/* sleep settings */}
      <div className="flex flex-row items-center justify-between rounded-lg border p-6 gap-6">
        <div className="space-y-1">
          <p className="text-lg">Prevent computer from entering sleep</p>
          <p className="text-sm font-light">
            First2Apply needs to run in the background to notify you of new jobs
          </p>
        </div>
        <Switch
          checked={settings.preventSleep}
          onCheckedChange={(checked) =>
            onUpdatedSettings({ ...settings, preventSleep: checked })
          }
        />
      </div>

      {/* notification settings */}
      <div className="flex flex-row items-center justify-between rounded-lg border p-6 gap-6">
        <div className="space-y-1">
          <p className="text-lg">Enable notification sounds</p>
          <p className="text-sm font-light">
            Play a sound when a new job is found in order to get your attention
          </p>
        </div>
        <Switch
          checked={settings.useSound}
          onCheckedChange={(checked) =>
            onUpdatedSettings({ ...settings, useSound: checked })
          }
        />
      </div>

      {/* email notifications */}
      <div className="flex flex-row items-center justify-between rounded-lg border p-6 gap-6">
        <div className="space-y-1">
          <p className="text-lg">
            Email notifications <span className="italic">(coming soon)</span>
          </p>
          <p className="text-sm font-light">
            Get notified of new jobs even when you are on the go
          </p>
        </div>
        <Switch disabled value={""} />
      </div>

      <div className="flex justify-end pt-4">
        <Button className="w-fit" variant="destructive" onClick={onLogout}>
          Logout
        </Button>
      </div>
    </DefaultLayout>
  );
}
