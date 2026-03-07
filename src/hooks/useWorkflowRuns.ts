import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { WorkflowRun } from "@/types/database";

export function useWorkflowRuns(workflowId?: string) {
  const { profile } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["workflow_runs", profile?.org_id, workflowId],
    queryFn: async () => {
      if (!profile?.org_id) return [];

      let query = supabase
        .from("workflow_runs")
        .select("*, workflows!inner(org_id)")
        .eq("workflows.org_id", profile.org_id)
        .order("started_at", { ascending: false })
        .limit(50);

      if (workflowId) {
        query = query.eq("workflow_id", workflowId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as WorkflowRun[];
    },
    enabled: !!profile?.org_id,
  });

  return { runs: data ?? [], loading: isLoading, error, refetch };
}
