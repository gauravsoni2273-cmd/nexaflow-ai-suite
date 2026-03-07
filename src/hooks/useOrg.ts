import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Organization } from "@/types/database";

export function useOrg() {
  const { profile } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["organization", profile?.org_id],
    queryFn: async () => {
      if (!profile?.org_id) return null;
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", profile.org_id)
        .single();
      if (error) throw error;
      return data as Organization;
    },
    enabled: !!profile?.org_id,
  });

  return { org: data ?? null, loading: isLoading, error, refetch };
}
