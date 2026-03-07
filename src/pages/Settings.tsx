import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useOrg } from "@/hooks/useOrg";
import { useCredits } from "@/hooks/useCredits";
import { mockTeam, mockTransactions } from "@/data/mock";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserProfile } from "@/types/database";

const settingsTabs = ["Profile", "Organization", "Team", "Credits"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Profile");
  const { user, profile } = useAuth();
  const { org, loading: orgLoading, refetch: refetchOrg } = useOrg();
  const { transactions, loading: txnLoading } = useCredits();

  const displayTransactions = transactions.length > 0 ? transactions : mockTransactions;
  const displayTeam = mockTeam;

  const creditBalance = org?.credit_balance ?? 2847;
  const creditLimit = org?.monthly_credit_limit ?? 5000;
  const consumed = creditLimit - creditBalance;

  const handleSaveProfile = async () => {
    const nameInput = (document.getElementById("settings-name") as HTMLInputElement)?.value;
    if (!nameInput) return;
    const { error } = await supabase.auth.updateUser({ data: { full_name: nameInput } });
    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated");
    }
  };

  const handlePurchaseCredits = () => {
    if (!org || !user) return;
    openRazorpayCheckout({
      orgId: org.id,
      userEmail: user.email ?? "",
      userName: profile?.full_name ?? "",
      onSuccess: () => {
        toast.success("Payment successful! Credits will be added shortly.");
        refetchOrg();
      },
    });
  };

  const txnTypeLabel = (type: string) => {
    switch (type) {
      case "purchase": return "Purchased";
      case "usage": return "Consumed";
      case "refund": return "Refunded";
      case "monthly_grant": return "Monthly Grant";
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {settingsTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Profile */}
      {activeTab === "Profile" && (
        <div className="surface-card max-w-lg p-6 space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input id="settings-name" defaultValue={user?.user_metadata?.full_name || profile?.full_name || ""} className="bg-background border-border" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input defaultValue={user?.email || ""} disabled className="bg-background border-border opacity-60" />
          </div>
          <Button className="gradient-primary text-primary-foreground" onClick={handleSaveProfile}>Save Changes</Button>
        </div>
      )}

      {/* Organization */}
      {activeTab === "Organization" && (
        <div className="surface-card max-w-lg p-6 space-y-4">
          {orgLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <>
              <div className="space-y-2">
                <Label>Workspace Name</Label>
                <Input defaultValue={org?.name ?? ""} disabled className="bg-background border-border opacity-60" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Plan</span>
                <span className="badge-success">{org?.plan ?? "free"}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Team */}
      {activeTab === "Team" && (
        <div className="space-y-4">
          <Button className="gradient-primary text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
          <div className="surface-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                </tr>
              </thead>
              <tbody>
                {displayTeam.map((m: UserProfile) => (
                  <tr key={m.id} className="border-b border-border last:border-0 transition-colors hover:surface-hover">
                    <td className="px-6 py-3 font-medium text-foreground">{m.full_name}</td>
                    <td className="px-6 py-3 text-muted-foreground">{m.email}</td>
                    <td className="px-6 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        m.role === "admin" ? "badge-success" : "bg-secondary text-secondary-foreground"
                      }`}>
                        {m.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Credits */}
      {activeTab === "Credits" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="surface-card p-5">
              <span className="text-xs text-muted-foreground">Balance</span>
              {orgLoading ? <Skeleton className="h-8 w-20 mt-1" /> : (
                <p className="mt-1 text-2xl font-bold font-mono text-primary">{creditBalance.toLocaleString()}</p>
              )}
            </div>
            <div className="surface-card p-5">
              <span className="text-xs text-muted-foreground">Consumed This Month</span>
              {orgLoading ? <Skeleton className="h-8 w-20 mt-1" /> : (
                <p className="mt-1 text-2xl font-bold font-mono text-warning">{consumed.toLocaleString()}</p>
              )}
            </div>
            <div className="surface-card flex items-center justify-center p-5">
              <Button className="gradient-primary text-primary-foreground" onClick={handlePurchaseCredits}>Purchase Credits</Button>
            </div>
          </div>
          <div className="surface-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {txnLoading ? (
                  <tr><td colSpan={3} className="px-6 py-4"><Skeleton className="h-8 w-full" /></td></tr>
                ) : (
                  displayTransactions.map((t) => (
                    <tr key={t.id} className="border-b border-border last:border-0 transition-colors hover:surface-hover">
                      <td className="px-6 py-3 font-mono text-muted-foreground text-xs">{t.created_at}</td>
                      <td className="px-6 py-3 text-foreground">{txnTypeLabel(t.type)}</td>
                      <td className={`px-6 py-3 font-mono font-medium ${t.amount > 0 ? "text-primary" : "text-warning"}`}>
                        {t.amount > 0 ? "+" : ""}{t.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
