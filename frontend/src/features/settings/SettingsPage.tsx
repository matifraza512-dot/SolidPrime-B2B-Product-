import { useState } from "react";
import { clsx } from "clsx";
import { ProfileTab } from "./ProfileTab";
import { OrganizationTab } from "./OrganizationTab";
import { NotificationsTab } from "./NotificationsTab";

const TABS = [
  { key: "profile", label: "Profile" },
  { key: "organization", label: "Organization" },
  { key: "notifications", label: "Notifications" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("profile");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold text-primary">Settings</h1>
        <p className="text-sm text-muted">Manage your profile, organization, and notification preferences.</p>
      </div>

      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "border-accent text-primary"
                : "border-transparent text-muted hover:text-secondary"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-2xl">
        {activeTab === "profile" && <ProfileTab />}
        {activeTab === "organization" && <OrganizationTab />}
        {activeTab === "notifications" && <NotificationsTab />}
      </div>
    </div>
  );
}
