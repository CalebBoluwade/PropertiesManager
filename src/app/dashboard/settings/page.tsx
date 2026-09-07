import { getDataMode } from "@/lib/data-mode";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const dataMode = await getDataMode();
  return <SettingsClient dataMode={dataMode} />;
}
