import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Lock, Loader2, ExternalLink, Copy, X, ChevronDown, FileSpreadsheet } from "lucide-react";
import { platformIcons } from "@/types/database";
import { toast } from "sonner";

// ── Slack Connect Modal ──

interface SlackConnectModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (webhookUrl: string) => Promise<void>;
}

function SlackConnectModal({ open, onClose, onSave }: SlackConnectModalProps) {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [testing, setTesting] = useState(false);
  const [tested, setTested] = useState(false);
  const [saving, setSaving] = useState(false);

  const isValidUrl = webhookUrl.startsWith("https://hooks.slack.com/");

  const handleTest = async () => {
    if (!isValidUrl) {
      toast.error("URL must start with https://hooks.slack.com/");
      return;
    }
    setTesting(true);
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "NexaFlow connected successfully!" }),
      });
      if (res.ok) {
        setTested(true);
        toast.success("Test message sent! Check your Slack channel.");
      } else {
        toast.error(`Slack returned ${res.status}. Check your webhook URL.`);
      }
    } catch {
      toast.error("Could not reach Slack. Check the URL and try again.");
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!isValidUrl) return;
    setSaving(true);
    await onSave(webhookUrl);
    setSaving(false);
    resetAndClose();
  };

  const resetAndClose = () => {
    setWebhookUrl("");
    setTesting(false);
    setTested(false);
    setSaving(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xl bg-black/60"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="bg-[#0F1525] border border-[#1E2538] rounded-2xl p-6 max-w-md mx-4 w-full relative"
          >
            <button onClick={resetAndClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <span className="text-2xl">{platformIcons.slack?.emoji}</span>
              <h2 className="text-lg font-bold text-foreground">Connect Slack</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-[#0B0F1A] border border-[#1E2538] rounded-lg p-4 space-y-2">
                <p className="text-xs font-medium text-foreground">Setup Instructions:</p>
                <ol className="text-xs text-[#8B92A8] space-y-1.5 list-decimal list-inside">
                  <li>Go to your Slack workspace Settings</li>
                  <li>Navigate to Incoming Webhooks and create a new webhook</li>
                  <li>Choose a channel and copy the webhook URL</li>
                </ol>
                <a
                  href="https://api.slack.com/messaging/webhooks"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors mt-2"
                >
                  Open Slack Webhooks Setup <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Paste your Slack Webhook URL</label>
                <Input
                  value={webhookUrl}
                  onChange={(e) => { setWebhookUrl(e.target.value); setTested(false); }}
                  placeholder="https://hooks.slack.com/services/T.../B.../..."
                  className="bg-background border-border text-sm font-mono"
                />
                {webhookUrl && !isValidUrl && (
                  <p className="text-xs text-destructive">URL must start with https://hooks.slack.com/</p>
                )}
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-[#0B0F1A] border border-[#1E2538] p-3">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Your webhook URL is stored securely and never shared.</p>
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  variant="outline"
                  className="flex-1 border-border text-sm"
                  onClick={handleTest}
                  disabled={!isValidUrl || testing}
                >
                  {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : tested ? <><Check className="mr-1.5 h-3.5 w-3.5 text-primary" /> Tested</> : "Test Connection"}
                </Button>
                <Button
                  className="flex-1 gradient-primary text-primary-foreground text-sm"
                  onClick={handleSave}
                  disabled={!isValidUrl || saving}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Google Sheets Connect Modal ──

const SERVICE_ACCOUNT_EMAIL = "nexaflow-bot@nexaflow-488510.iam.gserviceaccount.com";
const FETCH_TABS_URL = "https://n8n-production-d298.up.railway.app/webhook/fetch-sheet-tabs";

interface GoogleSheetsConnectModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (sheetId: string, sheetName: string) => Promise<void>;
  orgId: string;
}

function GoogleSheetsConnectModal({ open, onClose, onSave, orgId }: GoogleSheetsConnectModalProps) {
  const [sheetId, setSheetId] = useState("");
  const [sheetName, setSheetName] = useState("Sheet1");
  const [testing, setTesting] = useState(false);
  const [tested, setTested] = useState(false);
  const [saving, setSaving] = useState(false);

  // Tab fetching state
  const [fetchingTabs, setFetchingTabs] = useState(false);
  const [tabs, setTabs] = useState<string[] | null>(null);
  const [spreadsheetTitle, setSpreadsheetTitle] = useState<string | null>(null);
  const [tabFetchError, setTabFetchError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFetchedId = useRef("");

  const isValidId = sheetId.length > 10;

  // Debounce fetch tabs on sheet ID change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!isValidId || sheetId === lastFetchedId.current) return;

    // Reset tab state when ID changes
    setTabs(null);
    setSpreadsheetTitle(null);
    setTabFetchError(null);
    setTested(false);

    debounceRef.current = setTimeout(() => {
      fetchTabs(sheetId);
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [sheetId]);

  const fetchTabs = async (id: string) => {
    setFetchingTabs(true);
    setTabFetchError(null);
    setTabs(null);
    setSpreadsheetTitle(null);
    try {
      const res = await fetch(FETCH_TABS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheet_id: id }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.tabs) && data.tabs.length > 0) {
          setTabs(data.tabs);
          setSpreadsheetTitle(data.spreadsheet_title || null);
          setSheetName(data.tabs[0]);
          lastFetchedId.current = id;
        } else {
          setTabFetchError(
            data.error || "Could not read tabs. Make sure you've shared the sheet with the service account."
          );
        }
      } else {
        setTabFetchError(
          `Could not access this sheet. Make sure you've shared it with ${SERVICE_ACCOUNT_EMAIL}`
        );
      }
    } catch {
      setTabFetchError(
        `Could not access this sheet. Make sure you've shared it with ${SERVICE_ACCOUNT_EMAIL}`
      );
    } finally {
      setFetchingTabs(false);
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(SERVICE_ACCOUNT_EMAIL);
    toast.success("Email copied to clipboard!");
  };

  const handleTest = async () => {
    if (!isValidId) return;
    setTesting(true);
    try {
      const webhookBase = import.meta.env.VITE_N8N_WEBHOOK_BASE_URL ?? "";
      if (!webhookBase) {
        toast.info("Test skipped — webhook not configured. Save to connect.");
        setTested(true);
        setTesting(false);
        return;
      }
      const res = await fetch(`${webhookBase}/test-sheets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: orgId, sheet_id: sheetId, sheet_name: sheetName }),
      });
      if (res.ok) {
        setTested(true);
        toast.success("Google Sheet is accessible!");
      } else {
        const text = await res.text();
        toast.error(`Sheet test failed: ${text || res.statusText}`);
      }
    } catch {
      toast.error("Could not reach test endpoint. Save to connect anyway.");
      setTested(true);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!isValidId) return;
    setSaving(true);
    await onSave(sheetId, sheetName);
    setSaving(false);
    resetAndClose();
  };

  const resetAndClose = () => {
    setSheetId("");
    setSheetName("Sheet1");
    setTesting(false);
    setTested(false);
    setSaving(false);
    setTabs(null);
    setSpreadsheetTitle(null);
    setTabFetchError(null);
    lastFetchedId.current = "";
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xl bg-black/60"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="bg-[#0F1525] border border-[#1E2538] rounded-2xl p-6 max-w-md mx-4 w-full relative"
          >
            <button onClick={resetAndClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <span className="text-2xl">{platformIcons.google_workspace?.emoji}</span>
              <h2 className="text-lg font-bold text-foreground">Connect Google Sheets</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-[#0B0F1A] border border-[#1E2538] rounded-lg p-4">
                <p className="text-xs font-medium text-foreground mb-2">Share your Google Sheet with this email:</p>
                <div className="flex items-center gap-2 bg-[#0F1525] border border-[#1E2538] rounded-lg px-3 py-2">
                  <code className="text-xs text-primary font-mono flex-1 break-all">{SERVICE_ACCOUNT_EMAIL}</code>
                  <button onClick={handleCopyEmail} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Sheet ID + Fetch Tabs */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Google Sheet ID</label>
                <div className="flex gap-2">
                  <Input
                    value={sheetId}
                    onChange={(e) => { setSheetId(e.target.value); setTested(false); }}
                    placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                    className="bg-background border-border text-sm font-mono flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border shrink-0 px-3 h-9"
                    disabled={!isValidId || fetchingTabs}
                    onClick={() => fetchTabs(sheetId)}
                  >
                    {fetchingTabs ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#00E5CC]" />
                    ) : (
                      <span className="text-xs">Fetch Tabs</span>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Find this in the URL: docs.google.com/spreadsheets/d/<span className="text-primary">{"<ID>"}</span>/edit
                </p>
              </div>

              {/* Spreadsheet title confirmation */}
              {spreadsheetTitle && (
                <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
                  <FileSpreadsheet className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <p className="text-xs text-primary">
                    Found: <span className="font-medium">{spreadsheetTitle}</span>
                  </p>
                </div>
              )}

              {/* Tab fetch error */}
              {tabFetchError && (
                <div className="rounded-lg bg-destructive/5 border border-destructive/20 px-3 py-2">
                  <p className="text-xs text-destructive">{tabFetchError}</p>
                </div>
              )}

              {/* Sheet / Tab selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Sheet / Tab Name</label>
                {tabs && tabs.length > 0 ? (
                  /* Dropdown when tabs are fetched */
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex w-full items-center justify-between rounded-md bg-[#0F1525] border border-[#1E2538] px-3 py-2 text-sm text-foreground hover:border-[#00E5CC]/30 transition-colors"
                    >
                      <span>{sheetName}</span>
                      <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    {dropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full rounded-md bg-[#0F1525] border border-[#1E2538] py-1 shadow-lg max-h-40 overflow-y-auto">
                        {tabs.map((tab) => (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => {
                              setSheetName(tab);
                              setDropdownOpen(false);
                              setTested(false);
                            }}
                            className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
                              tab === sheetName
                                ? "bg-primary/10 text-primary"
                                : "text-foreground hover:bg-[#1E2538]"
                            }`}
                          >
                            {tab === sheetName && <Check className="h-3 w-3 shrink-0" />}
                            <span className={tab === sheetName ? "" : "pl-5"}>{tab}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Fallback text input */
                  <Input
                    value={sheetName}
                    onChange={(e) => { setSheetName(e.target.value); setTested(false); }}
                    placeholder="Sheet1"
                    className="bg-background border-border text-sm"
                  />
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  variant="outline"
                  className="flex-1 border-border text-sm"
                  onClick={handleTest}
                  disabled={!isValidId || testing}
                >
                  {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : tested ? <><Check className="mr-1.5 h-3.5 w-3.5 text-primary" /> Tested</> : "Test Connection"}
                </Button>
                <Button
                  className="flex-1 gradient-primary text-primary-foreground text-sm"
                  onClick={handleSave}
                  disabled={!isValidId || saving}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Coming Soon Modal ──

interface ComingSoonModalProps {
  platform: string | null;
  onClose: () => void;
}

function ComingSoonModal({ platform, onClose }: ComingSoonModalProps) {
  if (!platform) return null;
  const icon = platformIcons[platform];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xl bg-black/60"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-[#0F1525] border border-[#1E2538] rounded-2xl p-6 max-w-sm mx-4 w-full relative text-center"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
          <div className="text-4xl mb-3">{icon?.emoji ?? "\u2699\uFE0F"}</div>
          <h2 className="text-lg font-bold text-foreground mb-2">{icon?.label ?? platform}</h2>
          <p className="text-sm text-muted-foreground mb-5">
            This integration is coming soon. We're working on connecting {icon?.label ?? platform} to NexaFlow.
          </p>
          <Button variant="outline" className="border-border" onClick={onClose}>
            Got it
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Disconnect Modal ──

interface IntegrationDisconnectModalProps {
  platform: string | null;
  integrationId: string | null;
  onClose: () => void;
  onDisconnect: (id: string, platform: string) => Promise<void>;
}

export function IntegrationDisconnectModal({ platform, integrationId, onClose, onDisconnect }: IntegrationDisconnectModalProps) {
  const [disconnecting, setDisconnecting] = useState(false);

  if (!platform || !integrationId) return null;

  const icon = platformIcons[platform];

  const handleDisconnect = async () => {
    setDisconnecting(true);
    await onDisconnect(integrationId, platform);
    setDisconnecting(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xl bg-black/60"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-[#0F1525] border border-[#1E2538] rounded-2xl p-6 max-w-sm mx-4 w-full"
        >
          <h2 className="text-lg font-bold text-foreground mb-2">Disconnect {icon?.label ?? platform}?</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Workflows using {icon?.label ?? platform} may fail after disconnecting. You can reconnect at any time.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 border-border" onClick={onClose}>Cancel</Button>
            <Button
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDisconnect}
              disabled={disconnecting}
            >
              {disconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Disconnect"}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Main Export ──

interface IntegrationConnectModalProps {
  platform: string | null;
  orgId: string;
  onClose: () => void;
  onConnectSlack: (webhookUrl: string) => Promise<void>;
  onConnectGoogleSheets: (sheetId: string, sheetName: string) => Promise<void>;
}

export function IntegrationConnectModal({ platform, orgId, onClose, onConnectSlack, onConnectGoogleSheets }: IntegrationConnectModalProps) {
  if (!platform) return null;

  if (platform === "slack") {
    return <SlackConnectModal open onClose={onClose} onSave={onConnectSlack} />;
  }

  if (platform === "google_workspace") {
    return <GoogleSheetsConnectModal open onClose={onClose} onSave={onConnectGoogleSheets} orgId={orgId} />;
  }

  return <ComingSoonModal platform={platform} onClose={onClose} />;
}
