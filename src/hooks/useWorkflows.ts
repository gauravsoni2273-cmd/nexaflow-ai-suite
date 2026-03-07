import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Workflow } from "@/types/database";

export function useWorkflows() {
  const { profile } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["workflows", profile?.org_id],
    queryFn: async () => {
      if (!profile?.org_id) return [];
      const { data, error } = await supabase
        .from("workflows")
        .select("*")
        .eq("org_id", profile.org_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Workflow[];
    },
    enabled: !!profile?.org_id,
  });

  return { workflows: data ?? [], loading: isLoading, error, refetch };
}
