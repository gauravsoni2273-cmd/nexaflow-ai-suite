import { Button } from "@/components/ui/button";
import { useIntegrations } from "@/hooks/useIntegrations";
import { mockIntegrations } from "@/data/mock";
import { timeAgo } from "@/data/mock";
import { platformIcons } from "@/types/database";
import { Skeleton } from "@/components/ui/skeleton";

function StatusBadge({ status }: { status: string }) {
  const cls = status === "connected" ? "badge-success" : status === "error" ? "badge-failed" : "badge-running";
  const label = status === "connected" ? "Connected" : status === "error" ? "Reconnect" : "Not Connected";
  return <span className={cls}>{label}</span>;
}

export default function Integrations() {
  const { integrations, loading } = useIntegrations();
  const displayIntegrations = integrations.length > 0 ? integrations : mockIntegrations;

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
      <h1 className="text-2xl font-bold text-foreground">Integrations</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {displayIntegrations.map((int) => {
          const icon = platformIcons[int.platform];
          return (
            <div
              key={int.id}
              className={`surface-card p-5 transition-colors ${
                int.status === "connected" ? "border-l-2 border-l-primary" : ""
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
                  int.status === "connected"
                    ? "border-border"
                    : int.status === "error"
                    ? "bg-destructive/10 text-destructive hover:bg-destructive/20 border-0"
                    : "gradient-primary text-primary-foreground"
                }`}
                variant={int.status === "connected" ? "outline" : "default"}
              >
                {int.status === "connected" ? "Manage" : int.status === "error" ? "Reconnect" : "Connect"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
