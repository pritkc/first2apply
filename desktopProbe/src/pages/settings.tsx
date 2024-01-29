import { DefaultLayout } from "./defaultLayout";
import { Switch } from "@/components/ui/switch";
import { JobScannerSettings } from "@/lib/types";
import { logout } from "@/lib/electronMainSdk";
import { useError } from "@/hooks/error";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/session";
import { useSettings } from "@/hooks/settings";
import { SettingsSkeleton } from "@/components/skeletons/SettingsSkeleton";

export function SettingsPage() {
  const { handleError } = useError();
  const { logout: resetUser } = useSession();
  const { isLoading, settings, updateSettings } = useSettings();

  // Update settings
  const onUpdatedSettings = async (newSettings: JobScannerSettings) => {
    try {
      await updateSettings(newSettings);
    } catch (error) {
      handleError(error);
    }
  };

  // Logout
  const onLogout = async () => {
    try {
      await logout();
      resetUser();
    } catch (error) {
      handleError(error);
    }
  };

  if (isLoading) {
    return (
      <DefaultLayout className="p-6 md:p-10 xl:px-0 space-y-3">
        <SettingsSkeleton />
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout className="p-6 md:p-10 xl:px-0 space-y-3">
      <h1 className="text-2xl font-medium tracking-wide pb-3 w-fit">
        Settings
      </h1>
      {/* sleep settings */}
      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <p className="text-base">Prevent computer from entering sleep</p>
          <span className="text-sm">
            First2Apply needs to run in the background to notify you of new jobs
          </span>
        </div>
        <Switch
          checked={settings.preventSleep}
          onCheckedChange={(checked) =>
            onUpdatedSettings({ ...settings, preventSleep: checked })
          }
        />
      </div>

      {/* sleep settings */}
      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <p className="text-base">Enable notification sounds</p>
          <span className="text-sm">
            Play a sound when a new job is found in order to get your attention
          </span>
        </div>
        <Switch
          checked={settings.useSound}
          onCheckedChange={(checked) =>
            onUpdatedSettings({ ...settings, useSound: checked })
          }
        />
      </div>

      {/* email notifications */}
      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <p className="text-base">
            Email notifications <span className="italic">(coming soon)</span>
          </p>
          <span className="text-sm">
            Get notified of new jobs even when you are on the go
          </span>
        </div>
        <Switch disabled value={""} />
      </div>

      <div className="flex justify-end pt-4">
        <Button className="w-16" variant="destructive" onClick={onLogout}>
          Logout
        </Button>
      </div>
    </DefaultLayout>
  );
}
