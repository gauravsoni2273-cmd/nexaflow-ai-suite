import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Integration } from "@/types/database";

export function useIntegrations() {
  const { profile } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["integrations", profile?.org_id],
    queryFn: async () => {
      if (!profile?.org_id) return [];
      const { data, error } = await supabase
        .from("integrations")
        .select("*")
        .eq("org_id", profile.org_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Integration[];
    },
    enabled: !!profile?.org_id,
  });

  return { integrations: data ?? [], loading: isLoading, error, refetch };
}
