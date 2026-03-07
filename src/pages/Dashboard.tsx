import { Activity, Zap, CheckCircle, Coins, TrendingUp, Lightbulb } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Progress } from "@/components/ui/progress";
import { useWorkflows } from "@/hooks/useWorkflows";
import { useWorkflowRuns } from "@/hooks/useWorkflowRuns";
import { useOrg } from "@/hooks/useOrg";
import { mockDailyMetrics, mockSparkline, mockRuns as fallbackRuns, mockWorkflows } from "@/data/mock";
import { formatDuration, getWorkflowName } from "@/data/mock";
import { Skeleton } from "@/components/ui/skeleton";

const recommendations = [
  { workflow: "Invoice Processing", issue: "Failure rate spiked to 15% in the last 24 hours", fix: "Add retry logic for Salesforce API timeout errors", impact: "High" },
  { workflow: "Weekly Report Generator", issue: "Health score dropped below 50", fix: "Update Google Sheets API credentials (expired 3 days ago)", impact: "Critical" },
  { workflow: "Lead Qualification", issue: "Average duration increased by 40%", fix: "Parallelize the enrichment and scoring steps", impact: "Medium" },
];

function StatusBadge({ status }: { status: string }) {
  const cls = status === "success" ? "badge-success" : status === "failed" ? "badge-failed" : status === "running" ? "badge-running" : "badge-approval";
  return <span className={cls}>{status === "needs_approval" ? "approval" : status}</span>;
}

function MiniSparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 60},${20 - ((v - min) / range) * 18}`).join(" ");
  return (
    <svg viewBox="0 0 60 22" className="h-5 w-14">
      <polyline points={points} fill="none" stroke="hsl(173,100%,45%)" strokeWidth="1.5" />
    </svg>
  );
}

export default function Dashboard() {
  const { workflows, loading: wfLoading } = useWorkflows();
  const { runs, loading: runsLoading } = useWorkflowRuns();
  const { org, loading: orgLoading } = useOrg();

  const displayWorkflows = workflows.length > 0 ? workflows : mockWorkflows;
  const displayRuns = runs.length > 0 ? runs : fallbackRuns;

  const activeCount = displayWorkflows.filter((w) => w.status === "active").length;
  const creditBalance = org?.credit_balance ?? 2847;
  const creditLimit = org?.monthly_credit_limit ?? 5000;

  const avgSuccessRate = displayWorkflows.length > 0
    ? (displayWorkflows.reduce((sum, w) => sum + w.success_rate, 0) / displayWorkflows.length).toFixed(1)
    : "96.4";

  const metrics = [
    { label: "Active Workflows", value: String(activeCount), trend: "+3", trendUp: true, icon: Activity },
    { label: "Runs Today", value: String(displayRuns.length), sparkline: mockSparkline, icon: Zap },
    { label: "Success Rate", value: `${avgSuccessRate}%`, icon: CheckCircle },
    { label: "Credits Remaining", value: creditBalance.toLocaleString(), total: creditLimit, remaining: creditBalance, icon: Coins },
  ];

  const loading = wfLoading || runsLoading || orgLoading;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="surface-card p-5">
            {loading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{m.label}</span>
                  <m.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-2 flex items-end justify-between">
                  <span className="text-2xl font-bold font-mono text-foreground">{m.value}</span>
                  {m.trend && (
                    <span className="flex items-center gap-0.5 text-xs font-medium text-primary">
                      <TrendingUp className="h-3 w-3" />
                      {m.trend}
                    </span>
                  )}
                  {m.sparkline && <MiniSparkline data={m.sparkline} />}
                </div>
                {m.total && (
                  <div className="mt-3">
                    <Progress value={(m.remaining! / m.total) * 100} className="h-1.5 bg-secondary [&>div]:bg-warning" />
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span className="font-mono text-warning">{m.remaining!.toLocaleString()}</span> / {m.total.toLocaleString()}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="surface-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Workflow Executions (30 Days)</h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={mockDailyMetrics}>
            <defs>
              <linearGradient id="successGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(173,100%,45%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(173,100%,45%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,30%,17%)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(226,14%,41%)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(226,14%,41%)" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(224,42%,10%)", border: "1px solid hsl(224,30%,17%)", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "hsl(225,20%,93%)" }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="success" stroke="hsl(173,100%,45%)" fill="url(#successGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="failed" stroke="hsl(0,100%,71%)" fill="hsl(0,100%,71%,0.05)" strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Runs Table */}
      <div className="surface-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">Recent Workflow Runs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-6 py-3 font-medium">Workflow</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Credits</th>
                <th className="px-6 py-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {displayRuns.slice(0, 8).map((run) => (
                <tr key={run.id} className="border-b border-border last:border-0 transition-colors hover:surface-hover">
                  <td className="px-6 py-3 font-medium text-foreground">{getWorkflowName(run.workflow_id)}</td>
                  <td className="px-6 py-3"><StatusBadge status={run.status} /></td>
                  <td className="px-6 py-3 font-mono text-warning">{run.credits_consumed}</td>
                  <td className="px-6 py-3 text-muted-foreground">{new Date(run.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border px-6 py-3">
          <span className="text-xs text-muted-foreground">Showing {Math.min(8, displayRuns.length)} runs</span>
        </div>
      </div>

      {/* AI Recommendations */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-foreground">AI Recommendations</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {recommendations.map((r) => (
            <div key={r.workflow} className="surface-card p-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{r.workflow}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.impact === "Critical" ? "badge-failed" : r.impact === "High" ? "badge-approval" : "badge-running"}`}>
                  {r.impact}
                </span>
              </div>
              <p className="mb-3 text-xs text-muted-foreground leading-relaxed">{r.issue}</p>
              <div className="flex items-start gap-2 rounded-lg bg-background p-3">
                <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                <p className="text-xs text-secondary">{r.fix}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
