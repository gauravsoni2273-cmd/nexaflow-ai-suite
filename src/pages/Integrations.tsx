import { Button } from "@/components/ui/button";
import { useIntegrations } from "@/hooks/useIntegrations";
import { timeAgo } from "@/lib/helpers";
import { platformIcons } from "@/types/database";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const availablePlatforms = ["slack", "salesforce", "hubspot", "jira", "google_workspace", "asana", "notion", "github"];

function StatusBadge({ status }: { status: string }) {
  const cls = status === "connected" ? "badge-success" : status === "error" ? "badge-failed" : "badge-running";
  const label = status === "connected" ? "Connected" : status === "error" ? "Reconnect" : "Not Connected";
  return <span className={cls}>{label}</span>;
}

export default function Integrations() {
  const { integrations, loading, refetch } = useIntegrations();
  const { profile } = useAuth();

  const displayIntegrations = availablePlatforms.map((platform) => {
    const existing = integrations.find((i) => i.platform === platform);
    return existing ?? {
      id: `placeholder-${platform}`,
      org_id: profile?.org_id ?? "",
      platform,
      auth_token_enc: null,
      status: "not_connected" as const,
      last_synced_at: null,
      created_at: "",
    };
  });

  const handleConnect = async (platform: string) => {
    if (!profile?.org_id) return;
    const { error } = await supabase.from("integrations").insert({
      org_id: profile.org_id,
      platform,
      status: "connected",
      last_synced_at: new Date().toISOString(),
    });
    if (error) {
      toast.error(`Failed to connect ${platform}`);
    } else {
      toast.success(`${platformIcons[platform]?.label ?? platform} connected!`);
      refetch();
    }
  };

  const handleDisconnect = async (id: string, platform: string) => {
    if (id.startsWith("placeholder-")) return;
    const { error } = await supabase.from("integrations").delete().eq("id", id);
    if (error) {
      toast.error(`Failed to disconnect ${platform}`);
    } else {
      toast.success(`${platformIcons[platform]?.label ?? platform} disconnected`);
      refetch();
    }
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
        <span className="text-sm text-muted-foreground">
          {integrations.filter((i) => i.status === "connected").length} connected
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {displayIntegrations.map((int) => {
          const icon = platformIcons[int.platform];
          const isConnected = int.status === "connected";
          const isError = int.status === "error";
          return (
            <div
              key={int.id}
              className={`surface-card p-5 transition-colors ${
                isConnected ? "border-l-2 border-l-primary" : ""
              }`}
            >
              <div className="mb-4 text-3xl">{icon?.emoji ?? "\u2699\uFE0F"}</div>
              <h3 className="text-sm font-semibold text-foreground">{icon?.label ?? int.platform}</h3>
              <div className="mt-2">
                <StatusBadge status={int.status} />
              </div>
              {int.last_synced_at && (
                <p className="mt-2 text-xs text-muted-foreground">Last sync: {timeAgo(int.last_synced_at)}</p>
              )}
              <Button
                size="sm"
                className={`mt-4 w-full text-xs ${
                  isConnected
                    ? "border-border"
                    : isError
                    ? "bg-destructive/10 text-destructive hover:bg-destructive/20 border-0"
                    : "gradient-primary text-primary-foreground"
                }`}
                variant={isConnected ? "outline" : "default"}
                onClick={() => {
                  if (isConnected) handleDisconnect(int.id, int.platform);
                  else if (isError) handleReconnect(int.id, int.platform);
                  else handleConnect(int.platform);
                }}
              >
                {isConnected ? "Disconnect" : isError ? "Reconnect" : "Connect"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
