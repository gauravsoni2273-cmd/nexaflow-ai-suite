import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Building2, User, Plug, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { platformIcons } from "@/types/database";

const steps = [
  { label: "Profile", icon: User },
  { label: "Workspace", icon: Building2 },
  { label: "Integrations", icon: Plug },
];

const availablePlatforms = ["slack", "salesforce", "hubspot", "jira", "google_workspace", "asana", "notion", "github"];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const handleNext = () => {
    if (step === 0 && !fullName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (step === 1 && !workspaceName.trim()) {
      toast.error("Please enter a workspace name");
      return;
    }
    if (step < 2) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handleComplete = async () => {
    if (!user || !profile) return;
    setSaving(true);
    try {
      // Update user profile name
      await supabase.auth.updateUser({ data: { full_name: fullName } });
      await supabase.from("users").update({ full_name: fullName }).eq("id", user.id);

      // Update organization name
      if (profile.org_id) {
        await supabase.from("organizations").update({ name: workspaceName }).eq("id", profile.org_id);
      }

      // Create selected integrations
      if (selectedPlatforms.length > 0 && profile.org_id) {
        const inserts = selectedPlatforms.map((platform) => ({
          org_id: profile.org_id,
          platform,
          status: "connected" as const,
          last_synced_at: new Date().toISOString(),
        }));
        await supabase.from("integrations").insert(inserts);
      }

      // Mark onboarding as completed
      await supabase.from("users").update({ onboarding_completed: true }).eq("id", user.id);

      toast.success("Welcome to NexaFlow!");
      navigate("/dashboard", { replace: true });
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-lg px-6">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="gradient-primary flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold text-primary-foreground">N</div>
          <span className="text-2xl font-bold text-foreground">NexaFlow</span>
        </div>

        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-center gap-4">
          {steps.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                i === step
                  ? "bg-primary text-primary-foreground"
                  : i < step
                  ? "bg-primary/20 text-primary"
                  : "bg-secondary text-muted-foreground"
              }`}>
                {i < step ? <Check className="h-3 w-3" /> : <s.icon className="h-3 w-3" />}
                {s.label}
              </div>
              {i < steps.length - 1 && <div className={`h-px w-8 ${i < step ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="surface-card p-8">
          {step === 0 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-foreground">Welcome! Let's get started</h2>
                <p className="mt-2 text-sm text-muted-foreground">Tell us about yourself</p>
              </div>
              <div className="space-y-2">
                <Label>Your Full Name</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your name"
                  className="bg-background border-border"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email ?? ""} disabled className="bg-background border-border opacity-60" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-foreground">Set up your workspace</h2>
                <p className="mt-2 text-sm text-muted-foreground">This is where your team will collaborate</p>
              </div>
              <div className="space-y-2">
                <Label>Workspace Name</Label>
                <Input
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="e.g., Acme Corp"
                  className="bg-background border-border"
                  autoFocus
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-foreground">Connect your tools</h2>
                <p className="mt-2 text-sm text-muted-foreground">Select the platforms you use (you can change this later)</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {availablePlatforms.map((platform) => {
                  const icon = platformIcons[platform];
                  const isSelected = selectedPlatforms.includes(platform);
                  return (
                    <button
                      key={platform}
                      onClick={() => togglePlatform(platform)}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <span className="text-xl">{icon?.emoji ?? "\u2699\uFE0F"}</span>
                      <span className="text-sm font-medium text-foreground">{icon?.label ?? platform}</span>
                      {isSelected && <Check className="ml-auto h-4 w-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>
            ) : (
              <div />
            )}
            <Button
              onClick={handleNext}
              disabled={saving}
              className="gradient-primary text-primary-foreground px-6"
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Setting up...
                </div>
              ) : step === 2 ? (
                <>
                  {selectedPlatforms.length > 0 ? "Complete Setup" : "Skip & Finish"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
