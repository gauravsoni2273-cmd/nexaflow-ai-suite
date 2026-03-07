import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, BarChart3, Zap, Check, ArrowRight, Play } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useOrg } from "@/hooks/useOrg";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { toast } from "sonner";

const features = [
  { icon: Brain, title: "Agentic Orchestration", desc: "Deploy autonomous AI agents that reason, plan, and execute multi-step workflows across your entire tech stack." },
  { icon: BarChart3, title: "Workflow Intelligence", desc: "Real-time analytics and health scoring powered by ML. Predict failures before they happen." },
  { icon: Zap, title: "One-Click Integrations", desc: "Connect to 200+ enterprise tools in seconds. No code, no config, just results." },
];

const howItWorks = [
  { emoji: "\u270D\uFE0F", title: "Describe in English", desc: "Tell NexaFlow what you want automated. \"When a deal closes, notify the team and create follow-up tasks.\"" },
  { emoji: "\uD83E\uDDE0", title: "AI Builds the Plan", desc: "Our AI agent analyzes your connected tools, figures out the steps, sets approval gates, and generates an execution plan." },
  { emoji: "\u26A1", title: "Deploy & Monitor", desc: "One click to deploy. Track success rates, credit usage, and get AI-powered optimization suggestions." },
];

const exampleFlow = [
  { label: "HubSpot deal closes", emoji: "\uD83D\uDFE0" },
  { label: "Slack notification", emoji: "\uD83D\uDCAC" },
  { label: "Salesforce record", emoji: "\u2601\uFE0F" },
  { label: "Calendar kickoff", emoji: "\uD83D\uDCC5" },
];

const tiers = [
  { name: "Free", price: "\u20B90", period: "/month", credits: "500 credits", features: ["5 workflows", "500 credits/month", "Basic analytics", "Email support"], cta: "Start Free", highlight: false },
  { name: "Pro", price: "\u20B92,499", period: "/month", credits: "5,000 credits", features: ["Unlimited workflows", "5,000 credits/month", "Advanced analytics", "Priority support", "Custom integrations", "Team collaboration"], cta: "Start Pro Trial", highlight: true },
  { name: "Enterprise", price: "Custom", period: "", credits: "Unlimited", features: ["Everything in Pro", "Unlimited credits", "SLA guarantee", "Dedicated CSM", "SSO & SAML", "On-premise option"], cta: "Contact Sales", highlight: false },
];

export default function Landing() {
  const { user, profile } = useAuth();
  const { org, refetch: refetchOrg } = useOrg();
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleProCta = () => {
    if (!user) {
      navigate("/signup");
      return;
    }
    openRazorpayCheckout({
      orgId: org?.id ?? profile?.org_id ?? "",
      userEmail: user.email ?? "",
      userName: profile?.full_name ?? "",
      onSuccess: () => {
        toast.success("Payment successful! Credits will be added shortly.");
        refetchOrg();
      },
    });
  };

  const handlePricingCta = (tierName: string) => {
    if (tierName === "Free") {
      navigate("/signup");
    } else if (tierName === "Pro") {
      handleProCta();
    } else if (tierName === "Enterprise") {
      toast.info("Contact us at sales@nexaflow.ai for Enterprise pricing.");
      window.location.href = "mailto:sales@nexaflow.ai";
    }
  };

  return (
    <div id="top" className="min-h-screen bg-background page-transition">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="gradient-primary flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-primary-foreground">N</div>
            <span className="text-lg font-bold text-foreground">NexaFlow</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <button onClick={() => scrollToSection("product")} className="text-sm text-secondary hover:text-foreground transition-colors">Product</button>
            <button onClick={() => scrollToSection("pricing")} className="text-sm text-secondary hover:text-foreground transition-colors">Pricing</button>
            <button onClick={() => scrollToSection("top")} className="text-sm text-secondary hover:text-foreground transition-colors">Docs</button>
          </div>
          <Link to="/dashboard">
            <Button size="sm" className="gradient-primary text-primary-foreground">
              Open Dashboard
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-36">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-6xl lg:text-7xl">
            <span className="gradient-text">AI Agents That Run</span>
            <br />
            <span className="gradient-text">Your Enterprise</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-secondary">
            Build, deploy, and monitor intelligent workflows that connect your tools, automate decisions, and scale operations — all powered by autonomous AI agents.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="gradient-primary text-primary-foreground px-8">
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-border px-8">
              <Play className="mr-2 h-4 w-4" />
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="product" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">How NexaFlow Works</h2>
            <p className="mt-3 text-secondary">Three steps to automate any cross-platform workflow</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {howItWorks.map((step, i) => (
              <div key={step.title} className="surface-card p-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-3xl">
                  {step.emoji}
                </div>
                <div className="mb-2 text-xs font-semibold text-primary tracking-widest uppercase">Step {i + 1}</div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm leading-relaxed text-secondary">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Example flow */}
          <div className="mt-10 surface-card p-6">
            <p className="mb-4 text-center text-sm font-medium text-muted-foreground">Example workflow</p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {exampleFlow.map((item, i) => (
                <div key={item.label} className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2">
                    <span className="text-base">{item.emoji}</span>
                    <span className="text-xs font-medium text-foreground whitespace-nowrap">{item.label}</span>
                  </div>
                  {i < exampleFlow.length - 1 && (
                    <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="surface-card p-6 transition-colors hover:border-primary/30">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-secondary">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground">Simple, transparent pricing</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {tiers.map((t) => (
              <div
                key={t.name}
                className={`surface-card relative p-6 transition-colors ${
                  t.highlight ? "border-primary/50 glow-primary-sm" : ""
                }`}
              >
                {t.highlight && (
                  <div className="absolute -top-px left-6 right-6 h-0.5 gradient-primary rounded-full" />
                )}
                <h3 className="text-lg font-semibold text-foreground">{t.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold font-mono text-foreground">{t.price}</span>
                  <span className="text-sm text-muted-foreground">{t.period}</span>
                </div>
                <p className="mt-1 text-sm text-primary">{t.credits}</p>
                <ul className="mt-6 space-y-3">
                  {t.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-sm text-secondary">
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`mt-6 w-full ${
                    t.highlight
                      ? "gradient-primary text-primary-foreground"
                      : "border-border"
                  }`}
                  variant={t.highlight ? "default" : "outline"}
                  onClick={() => handlePricingCta(t.name)}
                >
                  {t.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="gradient-primary flex h-6 w-6 items-center justify-center rounded text-xs font-bold text-primary-foreground">N</div>
            <span className="text-sm font-semibold text-foreground">NexaFlow</span>
          </div>
          <div className="flex gap-6">
            <button onClick={() => scrollToSection("top")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy</button>
            <button onClick={() => scrollToSection("top")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms</button>
            <button onClick={() => scrollToSection("top")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Docs</button>
            <button onClick={() => scrollToSection("top")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Status</button>
          </div>
          <p className="text-xs text-muted-foreground">&copy; 2026 NexaFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
