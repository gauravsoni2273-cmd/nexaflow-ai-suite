import { useState } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Lightbulb } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useWorkflows } from "@/hooks/useWorkflows";
import { useOrg } from "@/hooks/useOrg";
import { mockDailyMetrics, mockWorkflows } from "@/data/mock";
import { formatDuration } from "@/data/mock";

const tabs = ["7d", "30d", "90d"];

const insights = [
  "Lead Qualification Pipeline has a 97.2% success rate \u2014 consider using it as a template for other workflows.",
  "Credit consumption peaked on Tuesdays. Schedule non-critical workflows to off-peak hours to balance load.",
  "Invoice Processing failure rate can be reduced by 60% by adding a validation step before the Salesforce sync.",
];

export default function Analytics() {
  const [activeTab, setActiveTab] = useState("30d");
  const { workflows } = useWorkflows();
  const { org } = useOrg();

  const displayWorkflows = workflows.length > 0 ? workflows : mockWorkflows;

  const creditsByWorkflow = [...displayWorkflows]
    .sort((a, b) => b.avg_execution_ms - a.avg_execution_ms)
    .slice(0, 5)
    .map((w) => ({ name: w.name.length > 20 ? w.name.slice(0, 20) + "\u2026" : w.name, credits: Math.round(w.success_rate * 30) }));

  const totalRuns = displayWorkflows.reduce((s, w) => s + Math.round(w.success_rate * 10), 0);
  const avgSuccessRate = displayWorkflows.length > 0
    ? (displayWorkflows.reduce((s, w) => s + w.success_rate, 0) / displayWorkflows.length).toFixed(1)
    : "96.4";

  const summaryMetrics = [
    { label: "Total Runs", value: totalRuns.toLocaleString() },
    { label: "Credits Consumed", value: (org?.monthly_credit_limit ?? 5000 - (org?.credit_balance ?? 2847)).toLocaleString() },
    { label: "Avg Execution Time", value: displayWorkflows.length > 0 ? formatDuration(displayWorkflows.reduce((s, w) => s + w.avg_execution_ms, 0) / displayWorkflows.length) : "2m 34s" },
    { label: "SLA Compliance", value: `${avgSuccessRate}%` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <div className="flex gap-1 rounded-lg border border-border p-1">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                activeTab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryMetrics.map((m) => (
          <div key={m.label} className="surface-card p-5">
            <span className="text-xs text-muted-foreground">{m.label}</span>
            <p className="mt-1 text-2xl font-bold font-mono text-foreground">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Area Chart */}
      <div className="surface-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Execution Volume & Success Rate</h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={mockDailyMetrics}>
            <defs>
              <linearGradient id="agSucc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(173,100%,45%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(173,100%,45%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,30%,17%)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(226,14%,41%)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(226,14%,41%)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ backgroundColor: "hsl(224,42%,10%)", border: "1px solid hsl(224,30%,17%)", borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="total" stroke="hsl(226,14%,60%)" fill="none" strokeWidth={1} strokeDasharray="4 4" />
            <Area type="monotone" dataKey="success" stroke="hsl(173,100%,45%)" fill="url(#agSucc)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Credits by Workflow */}
      <div className="surface-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Credits by Workflow (Top 5)</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={creditsByWorkflow} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,30%,17%)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(226,14%,41%)" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(226,14%,60%)" }} axisLine={false} tickLine={false} width={140} />
            <Tooltip contentStyle={{ backgroundColor: "hsl(224,42%,10%)", border: "1px solid hsl(224,30%,17%)", borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="credits" fill="hsl(36,100%,64%)" radius={[0, 4, 4, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Workflow Health Table */}
      <div className="surface-card overflow-x-auto">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">Workflow Health</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-6 py-3 font-medium">Workflow</th>
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
                  <td className="px-6 py-3 font-medium text-foreground">{w.name}</td>
                  <td className="px-6 py-3 font-mono text-primary">{w.success_rate}%</td>
                  <td className="px-6 py-3 font-mono text-muted-foreground">{formatDuration(w.avg_execution_ms)}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <Progress value={healthScore} className={`h-1.5 w-16 bg-secondary [&>div]:${healthScore > 80 ? "bg-primary" : healthScore > 60 ? "bg-warning" : "bg-destructive"}`} />
                      <span className={`font-mono text-xs ${healthScore > 80 ? "text-primary" : healthScore > 60 ? "text-warning" : "text-destructive"}`}>{healthScore}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* AI Insights */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-foreground">AI Insights</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {insights.map((insight, i) => (
            <div key={i} className="surface-card border-l-2 border-l-warning p-4">
              <div className="flex items-start gap-2">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <p className="text-sm text-secondary leading-relaxed">{insight}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
