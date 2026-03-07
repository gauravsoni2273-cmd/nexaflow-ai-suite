import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Pause, Play, Trash2, Eye, GitBranch, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useWorkflows } from "@/hooks/useWorkflows";
import { useWorkflowRuns } from "@/hooks/useWorkflowRuns";
import { useOrg } from "@/hooks/useOrg";
import { formatDuration } from "@/lib/helpers";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { handleTestRun } from "@/lib/testRun";
import type { AgentPlan } from "@/types/database";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const { workflows, loading, refetch: refetchWorkflows } = useWorkflows();
  const { refetch: refetchRuns } = useWorkflowRuns();
  const { org, refetch: refetchOrg } = useOrg();
  const [viewPlan, setViewPlan] = useState<AgentPlan | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [runningTestId, setRunningTestId] = useState<string | null>(null);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    const { error } = await supabase
      .from("workflows")
      .update({ status: newStatus })
      .eq("id", id);
    if (error) {
      toast.error("Failed to update workflow status");
    } else {
      toast.success(`Workflow ${newStatus === "active" ? "resumed" : "paused"}`);
      refetchWorkflows();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase
      .from("workflows")
      .delete()
      .eq("id", deleteId);
    if (error) {
      toast.error("Failed to delete workflow");
    } else {
      toast.success("Workflow deleted");
      refetchWorkflows();
    }
    setDeleteId(null);
  };

  const onTestRun = async (workflow: typeof workflows[0]) => {
    if (!org || runningTestId) return;
    setRunningTestId(workflow.id);
    await handleTestRun({
      workflow,
      orgId: org.id,
      onComplete: () => {
        refetchOrg();
        refetchRuns();
        refetchWorkflows();
        setRunningTestId(null);
      },
    });
  };

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
      ) : workflows.length === 0 ? (
        <div className="surface-card flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <GitBranch className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No workflows yet</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Create your first AI-powered workflow to automate tasks across your tools.
          </p>
          <Link to="/dashboard/workflows/new">
            <Button className="mt-4 gradient-primary text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Create Workflow
            </Button>
          </Link>
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
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {workflows.map((w) => {
                const healthScore = Math.round(w.success_rate * 0.95);
                const isRunning = runningTestId === w.id;
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
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {/* Test Run */}
                        {w.status === "active" && w.agent_plan_json && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-primary hover:text-primary/80"
                            onClick={() => onTestRun(w)}
                            disabled={!!runningTestId}
                            title="Run test"
                          >
                            {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                          </Button>
                        )}
                        {w.agent_plan_json && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => setViewPlan(w.agent_plan_json)}
                            title="View plan"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => handleToggleStatus(w.id, w.status)}
                          title={w.status === "active" ? "Pause" : "Resume"}
                        >
                          {w.status === "active" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteId(w.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* View Plan Dialog */}
      <Dialog open={!!viewPlan} onOpenChange={() => setViewPlan(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewPlan?.workflow_name ?? "Workflow Plan"}</DialogTitle>
          </DialogHeader>
          {viewPlan && (
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trigger</span>
                <span className="text-foreground">{viewPlan.trigger.type} — {viewPlan.trigger.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Credits</span>
                <span className="font-mono text-warning">{viewPlan.total_estimated_credits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Risk Level</span>
                <span className={`font-mono ${viewPlan.risk_level === "low" ? "text-primary" : viewPlan.risk_level === "medium" ? "text-warning" : "text-destructive"}`}>
                  {viewPlan.risk_level}
                </span>
              </div>
              <div className="border-t border-border pt-4 space-y-3">
                <h4 className="font-semibold text-foreground">Steps</h4>
                {viewPlan.steps.map((step, i) => (
                  <div key={i} className="rounded-lg bg-background p-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs font-mono text-primary">{step.step_number}</span>
                      <span className="font-medium text-foreground">{step.platform}</span>
                      {step.require_approval && <span className="badge-approval text-xs">Approval</span>}
                    </div>
                    <p className="mt-1 text-muted-foreground">{step.action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the workflow and all associated run history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
