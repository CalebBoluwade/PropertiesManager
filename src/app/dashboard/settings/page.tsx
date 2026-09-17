import { getDataMode, isCurrencyLocked } from "@/lib/data-mode";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const [dataMode, currencyLocked] = await Promise.all([getDataMode(), isCurrencyLocked()]);
  return <SettingsClient dataMode={dataMode} currencyLocked={currencyLocked} />;
}
