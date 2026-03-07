import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { CreditTransaction } from "@/types/database";

export function useCredits() {
  const { profile } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["credit_transactions", profile?.org_id],
    queryFn: async () => {
      if (!profile?.org_id) return [];
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("org_id", profile.org_id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as CreditTransaction[];
    },
    enabled: !!profile?.org_id,
  });

  return { transactions: data ?? [], loading: isLoading, error, refetch };
}
