import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useIntegrations } from "@/hooks/useIntegrations";
import { timeAgo } from "@/lib/helpers";
import { platformIcons } from "@/types/database";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { IntegrationConnectModal, IntegrationDisconnectModal } from "@/components/IntegrationConnectModal";
import { Plus, Copy, Trash2 } from "lucide-react";
import type { Integration } from "@/types/database";

const MULTI_PLATFORMS = ["slack", "google_workspace"];
const availablePlatforms = ["slack", "google_workspace", "salesforce", "hubspot", "jira", "asana", "notion", "github"];

// ── Helpers to parse auth_token_enc ──

interface SlackConfig {
  webhook_url: string;
  channel_label: string;
}

interface GSheetsConfig {
  sheet_id: string;
  sheet_name: string;
  spreadsheet_title?: string;
}

function parseSlackConfig(int: Integration): SlackConfig {
  if (!int.auth_token_enc) return { webhook_url: "", channel_label: "Slack" };
  try {
    const parsed = JSON.parse(int.auth_token_enc);
    if (parsed.webhook_url) return parsed as SlackConfig;
    // Legacy: plain webhook URL string won't parse as object with webhook_url
  } catch { /* not JSON */ }
  // Legacy format: plain URL string
  return { webhook_url: int.auth_token_enc, channel_label: "#channel" };
}

function parseGSheetsConfig(int: Integration): GSheetsConfig {
  if (!int.auth_token_enc) return { sheet_id: "", sheet_name: "Sheet1" };
  try {
    return JSON.parse(int.auth_token_enc) as GSheetsConfig;
  } catch {
    return { sheet_id: int.auth_token_enc, sheet_name: "Sheet1" };
  }
}

function truncateId(id: string, len = 16) {
  return id.length > len ? id.slice(0, len) + "..." : id;
}

// ── Status Badge ──

function StatusBadge({ status }: { status: string }) {
  const cls = status === "connected" ? "badge-success" : status === "error" ? "badge-failed" : "badge-running";
  const label = status === "connected" ? "Connected" : status === "error" ? "Reconnect" : "Not Connected";
  return <span className={cls}>{label}</span>;
}

// ── Multi-connection sub-list for Slack ──

function SlackConnectionList({
  connections,
  onAdd,
  onDisconnect,
}: {
  connections: Integration[];
  onAdd: () => void;
  onDisconnect: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      {connections.map((int) => {
        const config = parseSlackConfig(int);
        return (
          <div
            key={int.id}
            className="flex items-center gap-3 bg-[#0B0F1A] border border-[#1E2538] rounded-lg px-3 py-2"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{config.channel_label}</p>
              <p className="text-[10px] text-muted-foreground font-mono truncate">{truncateId(config.webhook_url, 40)}</p>
            </div>
            <button
              onClick={() => onDisconnect(int.id)}
              className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
              title="Disconnect"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
      <button
        onClick={onAdd}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#1E2538] py-2 text-xs text-primary hover:border-primary/40 transition-colors"
      >
        <Plus className="h-3 w-3" />
        Add Channel
      </button>
    </div>
  );
}

// ── Multi-connection sub-list for Google Sheets ──

function GSheetsConnectionList({
  connections,
  onAdd,
  onDisconnect,
}: {
  connections: Integration[];
  onAdd: () => void;
  onDisconnect: (id: string) => void;
}) {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Sheet ID copied!");
  };

  return (
    <div className="space-y-2">
      {connections.map((int) => {
        const config = parseGSheetsConfig(int);
        return (
          <div
            key={int.id}
            className="flex items-center gap-3 bg-[#0B0F1A] border border-[#1E2538] rounded-lg px-3 py-2"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {config.spreadsheet_title || "Untitled Sheet"}
                <span className="text-muted-foreground font-normal"> / {config.sheet_name}</span>
              </p>
              <div className="flex items-center gap-1">
                <p className="text-[10px] text-muted-foreground font-mono truncate">{truncateId(config.sheet_id)}</p>
                <button onClick={() => handleCopy(config.sheet_id)} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                  <Copy className="h-2.5 w-2.5" />
                </button>
              </div>
            </div>
            <button
              onClick={() => onDisconnect(int.id)}
              className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
              title="Disconnect"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
      <button
        onClick={onAdd}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#1E2538] py-2 text-xs text-primary hover:border-primary/40 transition-colors"
      >
        <Plus className="h-3 w-3" />
        Add Sheet
      </button>
    </div>
  );
}

// ── Main Page ──

export default function Integrations() {
  const { integrations, loading, refetch } = useIntegrations();
  const { profile } = useAuth();
  const [connectPlatform, setConnectPlatform] = useState<string | null>(null);
  const [disconnectPlatform, setDisconnectPlatform] = useState<string | null>(null);
  const [disconnectId, setDisconnectId] = useState<string | null>(null);

  // Group integrations by platform
  const getConnections = (platform: string) =>
    integrations.filter((i) => i.platform === platform && i.status === "connected");

  const totalConnected = integrations.filter((i) => i.status === "connected").length;

  const handleConnectSlack = async (webhookUrl: string, channelLabel: string) => {
    if (!profile?.org_id) return;
    const { error } = await supabase.from("integrations").insert({
      org_id: profile.org_id,
      platform: "slack",
      auth_token_enc: JSON.stringify({ webhook_url: webhookUrl, channel_label: channelLabel }),
      status: "connected",
      last_synced_at: new Date().toISOString(),
    });
    if (error) {
      toast.error("Failed to connect Slack");
    } else {
      toast.success(`Slack ${channelLabel} connected!`);
      refetch();
    }
    setConnectPlatform(null);
  };

  const handleConnectGoogleSheets = async (sheetId: string, sheetName: string, spreadsheetTitle: string | null) => {
    if (!profile?.org_id) return;
    const { error } = await supabase.from("integrations").insert({
      org_id: profile.org_id,
      platform: "google_workspace",
      auth_token_enc: JSON.stringify({ sheet_id: sheetId, sheet_name: sheetName, spreadsheet_title: spreadsheetTitle }),
      status: "connected",
      last_synced_at: new Date().toISOString(),
    });
    if (error) {
      toast.error("Failed to connect Google Sheets");
    } else {
      toast.success("Google Sheet connected!");
      refetch();
    }
    setConnectPlatform(null);
  };

  const handleDisconnect = async (id: string, platform: string) => {
    if (id.startsWith("placeholder-")) return;
    const { error } = await supabase.from("integrations").delete().eq("id", id);
    if (error) {
      toast.error(`Failed to disconnect ${platformIcons[platform]?.label ?? platform}`);
    } else {
      toast.success(`${platformIcons[platform]?.label ?? platform} disconnected`);
      refetch();
    }
  };

  const handleQuickDisconnect = async (id: string) => {
    const int = integrations.find((i) => i.id === id);
    if (!int) return;
    await handleDisconnect(id, int.platform);
  };

  const handleReconnect = async (id: string, platform: string) => {
    if (id.startsWith("placeholder-")) return;
    const { error } = await supabase
      .from("integrations")
      .update({ status: "connected", last_synced_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error(`Failed to reconnect ${platform}`);
    } else {
      toast.success(`${platformIcons[platform]?.label ?? platform} reconnected!`);
      refetch();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
        <span className="text-sm text-muted-foreground">
          {totalConnected} connected
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {availablePlatforms.map((platform) => {
          const icon = platformIcons[platform];
          const isMulti = MULTI_PLATFORMS.includes(platform);
          const connections = getConnections(platform);
          const hasConnections = connections.length > 0;

          // For single-connection platforms, find the first record
          const singleInt = !isMulti
            ? integrations.find((i) => i.platform === platform) ?? null
            : null;
          const singleConnected = singleInt?.status === "connected";
          const singleError = singleInt?.status === "error";

          return (
            <div
              key={platform}
              className={`surface-card p-5 transition-colors ${
                hasConnections || singleConnected ? "border-l-2 border-l-primary" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{icon?.emoji ?? "\u2699\uFE0F"}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{icon?.label ?? platform}</h3>
                    {isMulti && hasConnections && (
                      <p className="text-[10px] text-primary font-medium">
                        {connections.length} {platform === "slack" ? "channel" : "sheet"}{connections.length !== 1 ? "s" : ""} connected
                      </p>
                    )}
                  </div>
                </div>
                {!isMulti && singleInt?.last_synced_at && (
                  <span className="text-[10px] text-muted-foreground">{timeAgo(singleInt.last_synced_at)}</span>
                )}
              </div>

              {/* Multi-connection platforms: show list */}
              {isMulti ? (
                <div className="space-y-3">
                  {hasConnections && platform === "slack" && (
                    <SlackConnectionList
                      connections={connections}
                      onAdd={() => setConnectPlatform("slack")}
                      onDisconnect={handleQuickDisconnect}
                    />
                  )}
                  {hasConnections && platform === "google_workspace" && (
                    <GSheetsConnectionList
                      connections={connections}
                      onAdd={() => setConnectPlatform("google_workspace")}
                      onDisconnect={handleQuickDisconnect}
                    />
                  )}
                  {!hasConnections && (
                    <>
                      <div className="mt-1">
                        <StatusBadge status="not_connected" />
                      </div>
                      <Button
                        size="sm"
                        className="w-full text-xs gradient-primary text-primary-foreground"
                        onClick={() => setConnectPlatform(platform)}
                      >
                        Connect
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                /* Single-connection platforms */
                <>
                  <div className="mt-1">
                    <StatusBadge status={singleInt?.status ?? "not_connected"} />
                  </div>
                  <Button
                    size="sm"
                    className={`mt-4 w-full text-xs ${
                      singleConnected
                        ? "border-border"
                        : singleError
                        ? "bg-destructive/10 text-destructive hover:bg-destructive/20 border-0"
                        : "gradient-primary text-primary-foreground"
                    }`}
                    variant={singleConnected ? "outline" : "default"}
                    onClick={() => {
                      if (singleConnected && singleInt) {
                        setDisconnectPlatform(singleInt.platform);
                        setDisconnectId(singleInt.id);
                      } else if (singleError && singleInt) {
                        handleReconnect(singleInt.id, singleInt.platform);
                      } else {
                        setConnectPlatform(platform);
                      }
                    }}
                  >
                    {singleConnected ? "Disconnect" : singleError ? "Reconnect" : "Connect"}
                  </Button>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Connect Modal */}
      <IntegrationConnectModal
        platform={connectPlatform}
        orgId={profile?.org_id ?? ""}
        onClose={() => setConnectPlatform(null)}
        onConnectSlack={handleConnectSlack}
        onConnectGoogleSheets={handleConnectGoogleSheets}
      />

      {/* Disconnect Modal */}
      <IntegrationDisconnectModal
        platform={disconnectPlatform}
        integrationId={disconnectId}
        onClose={() => { setDisconnectPlatform(null); setDisconnectId(null); }}
        onDisconnect={handleDisconnect}
      />
    </motion.div>
  );
}
