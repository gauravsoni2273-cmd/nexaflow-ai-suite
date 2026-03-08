import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ open, onClose }: WelcomeModalProps) {
  const { user, refetchProfile } = useAuth();

  const handleGetStarted = async () => {
    if (user) {
      await supabase
        .from("users")
        .update({ onboarding_completed: true })
        .eq("id", user.id);
      await refetchProfile();
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xl bg-black/60"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="bg-[#0F1525] border border-[#1E2538] rounded-2xl p-8 max-w-md mx-4 w-full relative"
          >
            <button
              onClick={handleGetStarted}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-foreground">Welcome to NexaFlow!</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                You have <span className="font-mono font-bold text-primary">100</span> credits to start — enough for 2 free AI-generated workflows.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">1</div>
                <p className="text-sm text-[#B8BED9]">Use the <span className="text-foreground font-medium">AI Builder</span> to describe workflows in plain English</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">2</div>
                <p className="text-sm text-[#B8BED9]">Connect your tools in the <span className="text-foreground font-medium">Integrations</span> page</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">3</div>
                <p className="text-sm text-[#B8BED9]">Monitor runs and credits on your <span className="text-foreground font-medium">Dashboard</span></p>
              </div>
            </div>

            <Button
              onClick={handleGetStarted}
              className="w-full gradient-primary text-primary-foreground"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
