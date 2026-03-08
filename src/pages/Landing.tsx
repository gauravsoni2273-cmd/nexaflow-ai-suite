import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, BarChart3, Zap, Check, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useOrg } from "@/hooks/useOrg";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { toast } from "sonner";

const features = [
  { icon: Brain, title: "Agentic Orchestration", desc: "Deploy autonomous AI agents that reason, plan, and execute multi-step workflows across your entire tech stack." },
  { icon: BarChart3, title: "Workflow Intelligence", desc: "Real-time analytics and health scoring powered by ML. Predict failures before they happen." },
  { icon: Zap, title: "One-Click Integrations", desc: "Connect to 200+ enterprise tools in seconds. No code, no config, just results." },
];

const howItWorksData = [
  {
    step: "01",
    icon: "\u270D\uFE0F",
    title: "Describe in English",
    description: "Tell NexaFlow what you want automated in plain English. No coding, no flowcharts.",
    example: "\"When a deal closes, notify the team and create follow-up tasks.\"",
  },
  {
    step: "02",
    icon: "\uD83E\uDDE0",
    title: "AI Builds the Plan",
    description: "Our AI agent analyzes your tools, maps dependencies, sets approval gates, and generates an execution plan.",
    example: "HubSpot \u2192 Slack \u2192 Salesforce \u2192 Calendar",
  },
  {
    step: "03",
    icon: "\u26A1",
    title: "Deploy & Monitor",
    description: "One click to deploy. Track success rates, credit usage, and get AI optimization suggestions.",
    example: "94.7% success rate \u00B7 2.1s avg execution",
  },
];

const tiers = [
  { name: "Free", price: "\u20B90", period: "/month", credits: "100 credits", features: ["5 workflows", "100 credits/month", "Basic analytics", "Email support"], cta: "Start Free", highlight: false },
  { name: "Pro", price: "\u20B92,499", period: "/month", credits: "5,000 credits", features: ["Unlimited workflows", "5,000 credits/month", "Advanced analytics", "Priority support", "Custom integrations", "Team collaboration"], cta: "Upgrade to Pro", highlight: true },
  { name: "Enterprise", price: "Custom", period: "", credits: "Unlimited", features: ["Everything in Pro", "Unlimited credits", "SLA guarantee", "Dedicated CSM", "SSO & SAML", "On-premise option"], cta: "Contact Sales", highlight: false },
];

function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-[120px]"
        style={{
          background: "radial-gradient(circle, #00E5CC 0%, transparent 70%)",
          top: "-10%",
          left: "50%",
          animation: "float 8s ease-in-out infinite",
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-10 blur-[100px]"
        style={{
          background: "radial-gradient(circle, #7B93FF 0%, transparent 70%)",
          bottom: "20%",
          right: "10%",
          animation: "float-alt 12s ease-in-out infinite reverse",
        }}
      />
      <div
        className="absolute w-[300px] h-[300px] rounded-full opacity-10 blur-[80px]"
        style={{
          background: "radial-gradient(circle, #FFB547 0%, transparent 70%)",
          top: "60%",
          left: "5%",
          animation: "float-alt 10s ease-in-out infinite 2s",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}

export default function Landing() {
  const { user, profile } = useAuth();
  const { org, refetch: refetchOrg } = useOrg();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handlePricingCta = (tierName: string) => {
    if (tierName === "Free") {
      navigate("/signup");
    } else if (tierName === "Pro") {
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
    } else if (tierName === "Enterprise") {
      toast.info("Contact us at sales@nexaflow.ai for Enterprise pricing.");
      window.location.href = "mailto:sales@nexaflow.ai";
    }
  };

  return (
    <div id="top" className="min-h-screen bg-[#0B0F1A]">
      {/* Nav — Glass on scroll */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0B0F1A]/80 backdrop-blur-xl border-b border-[#1E2538]"
          : "bg-transparent"
      }`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="gradient-primary flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-primary-foreground">N</div>
            <span className="text-lg font-bold text-[#E8EAF0]">NexaFlow</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <button onClick={() => scrollToSection("features")} className="text-sm text-[#8B92A8] hover:text-[#E8EAF0] transition-colors font-medium">Product</button>
            <button onClick={() => scrollToSection("pricing")} className="text-sm text-[#8B92A8] hover:text-[#E8EAF0] transition-colors font-medium">Pricing</button>
            <button onClick={() => scrollToSection("how-it-works")} className="text-sm text-[#8B92A8] hover:text-[#E8EAF0] transition-colors font-medium">Docs</button>
          </div>
          <Link to="/dashboard">
            <button className="px-5 py-2 bg-[#00E5CC] text-[#0B0F1A] font-bold text-sm rounded-lg hover:shadow-[0_0_30px_rgba(0,229,204,0.3)] transition-all duration-300">
              Open Dashboard
              <ArrowRight className="ml-1 h-3.5 w-3.5 inline" />
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 md:px-12 text-center overflow-hidden">
        <AnimatedBackground />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00E5CC]/10 border border-[#00E5CC]/20 text-[#00E5CC] text-sm font-medium">
            ✦ Agentic Workflow Intelligence
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative z-10 mt-6 text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05]"
          style={{
            background: "linear-gradient(180deg, #FFFFFF 30%, #8B92A8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          AI Agents That Run{"\n"}Your Enterprise
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative z-10 mt-6 text-lg text-[#8B92A8] max-w-xl mx-auto"
        >
          Describe any cross-platform workflow in plain English.
          NexaFlow's AI agents plan, execute, and optimize it across all your tools.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="relative z-10 mt-10 flex gap-4 justify-center"
        >
          <button
            onClick={() => navigate("/signup")}
            className="px-8 py-3.5 bg-[#00E5CC] text-[#0B0F1A] font-bold rounded-xl hover:shadow-[0_0_40px_rgba(0,229,204,0.4)] transition-all duration-300 hover:-translate-y-0.5"
          >
            Start Free →
          </button>
          <button
            onClick={() => scrollToSection("how-it-works")}
            className="px-8 py-3.5 border border-[#2A3050] text-[#B8BED9] font-semibold rounded-xl hover:border-[#00E5CC]/50 transition-all duration-300"
          >
            See How It Works
          </button>
        </motion.div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 md:px-12 relative">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-4xl font-bold text-center text-[#E8EAF0] mb-4"
        >
          How NexaFlow Works
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-center text-[#8B92A8] mb-16 max-w-lg mx-auto"
        >
          Three steps to automate any cross-platform workflow
        </motion.p>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {howItWorksData.map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="group relative"
            >
              <div className="bg-[#0F1525] border border-[#1E2538] rounded-2xl p-8 h-full hover:border-[#00E5CC]/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,229,204,0.08)]">
                <span className="text-sm font-mono text-[#00E5CC]/50 font-bold">{item.step}</span>
                <div className="w-14 h-14 rounded-xl bg-[#0B0F1A] border border-[#1E2538] flex items-center justify-center mt-3 mb-5 text-2xl group-hover:border-[#00E5CC]/30 transition-colors duration-500">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-[#E8EAF0] mb-3">{item.title}</h3>
                <p className="text-[#8B92A8] text-sm leading-relaxed mb-4">{item.description}</p>
                <div className="bg-[#0B0F1A] rounded-lg px-4 py-3 border border-[#1E2538]">
                  <p className="text-xs text-[#5A6178] italic">{item.example}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto grid gap-6 md:grid-cols-3">
          {features.map((f, index) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -6, transition: { duration: 0.3 } }}
              className="bg-[#0F1525] border border-[#1E2538] rounded-2xl p-8 hover:border-[#00E5CC]/30 hover:shadow-[0_8px_30px_rgba(0,229,204,0.06)] transition-all duration-500 cursor-default"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#00E5CC]/10">
                <f.icon className="h-5 w-5 text-[#00E5CC]" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-[#E8EAF0]">{f.title}</h3>
              <p className="text-sm leading-relaxed text-[#8B92A8]">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center text-3xl md:text-4xl font-bold text-[#E8EAF0]"
          >
            Simple, transparent pricing
          </motion.h2>
          <div className="grid gap-6 md:grid-cols-3">
            {tiers.map((t, index) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.3 } }}
                className={`relative rounded-2xl p-8 overflow-hidden ${
                  t.highlight
                    ? "bg-gradient-to-b from-[#0D2E2A] to-[#0F1525] border border-[#00E5CC]/30"
                    : "bg-[#0F1525] border border-[#1E2538]"
                }`}
                style={t.highlight ? { animation: "pulse-glow 3s ease-in-out infinite" } : undefined}
              >
                {t.highlight && (
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00E5CC] to-transparent" />
                )}
                <h3 className="text-lg font-semibold text-[#E8EAF0]">{t.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold font-mono text-[#E8EAF0]">{t.price}</span>
                  <span className="text-sm text-[#5A6178]">{t.period}</span>
                </div>
                <p className="mt-1 text-sm text-[#00E5CC]">{t.credits}</p>
                <ul className="mt-6 space-y-3">
                  {t.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-sm text-[#8B92A8]">
                      <Check className="h-4 w-4 shrink-0 text-[#00E5CC]" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handlePricingCta(t.name)}
                  className={`w-full mt-6 py-3 font-bold rounded-lg transition-all duration-300 ${
                    t.highlight
                      ? "bg-[#00E5CC] text-[#0B0F1A] hover:shadow-[0_0_30px_rgba(0,229,204,0.3)]"
                      : "border border-[#2A3050] text-[#B8BED9] font-semibold hover:border-[#00E5CC]/50"
                  }`}
                >
                  {t.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1E2538] py-10 px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="gradient-primary flex h-6 w-6 items-center justify-center rounded text-xs font-bold text-primary-foreground">N</div>
            <span className="text-sm font-semibold text-[#E8EAF0]">NexaFlow</span>
          </div>
          <div className="flex gap-6">
            <button onClick={() => scrollToSection("top")} className="text-xs text-[#5A6178] hover:text-[#E8EAF0] transition-colors">Privacy</button>
            <button onClick={() => scrollToSection("top")} className="text-xs text-[#5A6178] hover:text-[#E8EAF0] transition-colors">Terms</button>
            <button onClick={() => scrollToSection("top")} className="text-xs text-[#5A6178] hover:text-[#E8EAF0] transition-colors">Docs</button>
            <button onClick={() => scrollToSection("top")} className="text-xs text-[#5A6178] hover:text-[#E8EAF0] transition-colors">Status</button>
          </div>
          <p className="text-xs text-[#5A6178]">&copy; 2026 NexaFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
