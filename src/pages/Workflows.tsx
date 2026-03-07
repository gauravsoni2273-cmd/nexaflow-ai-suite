import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useWorkflows } from "@/hooks/useWorkflows";
import { mockWorkflows } from "@/data/mock";
import { formatDuration } from "@/data/mock";
import { Skeleton } from "@/components/ui/skeleton";

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "active" ? "badge-success" : status === "paused" ? "badge-approval" : status === "draft" ? "badge-running" : "badge-failed";
  return <span className={cls}>{status}</span>;
}

function healthColor(score: number) {
  if (score > 80) return "bg-primary";
  if (score > 60) return "bg-warning";
  return "bg-destructive";
}

export default function Workflows() {
  const { workflows, loading } = useWorkflows();
  const displayWorkflows = workflows.length > 0 ? workflows : mockWorkflows;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Workflows</h1>
        <Link to="/dashboard/workflows/new">
          <Button className="gradient-primary text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" />
            New Workflow
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="surface-card p-6 space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : (
        <div className="surface-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Success Rate</th>
                <th className="px-6 py-3 font-medium">Avg Duration</th>
                <th className="px-6 py-3 font-medium">Health</th>
              </tr>
            </thead>
            <tbody>
              {displayWorkflows.map((w) => {
                const healthScore = Math.round(w.success_rate * 0.95);
                return (
                  <tr key={w.id} className="border-b border-border last:border-0 transition-colors hover:surface-hover">
                    <td className="px-6 py-4 font-medium text-foreground">{w.name}</td>
                    <td className="px-6 py-4"><StatusBadge status={w.status} /></td>
                    <td className="px-6 py-4">
                      <span className={`font-mono ${w.success_rate > 90 ? "text-primary" : w.success_rate > 70 ? "text-warning" : "text-destructive"}`}>
                        {w.success_rate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-muted-foreground">{formatDuration(w.avg_execution_ms)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Progress value={healthScore} className={`h-1.5 w-16 bg-secondary [&>div]:${healthColor(healthScore)}`} />
                        <span className={`font-mono text-xs ${healthScore > 80 ? "text-primary" : healthScore > 60 ? "text-warning" : "text-destructive"}`}>
                          {healthScore}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
