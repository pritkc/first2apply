import { DefaultLayout } from "./defaultLayout";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { JobScannerSettings } from "@/lib/types";
import { getProbeSettings, updateProbeSettings } from "@/lib/electronMainSdk";
import { useError } from "@/hooks/error";

export function SettingsPage() {
  const { handleError } = useError();

  const [settings, setSettings] = useState<JobScannerSettings>({
    cronRule: undefined,
    useSound: false,
    preventSleep: false,
  });

  useEffect(() => {
    const asyncLoad = async () => {
      try {
        // load settings when component is mounted
        setSettings(await getProbeSettings());
      } catch (error) {
        handleError(error);
      }
    };
    asyncLoad();
  }, []);

  const onUpdatedSettings = async (newSettings: JobScannerSettings) => {
    try {
      await updateProbeSettings(newSettings);
      setSettings(newSettings);
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <DefaultLayout className="p-6 md:p-10 xl:px-0 space-y-3">
      <h1 className="text-2xl font-medium tracking-wide pb-3">Settings</h1>
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
