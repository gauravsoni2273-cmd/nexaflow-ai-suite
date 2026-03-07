import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Lock, Loader2 } from "lucide-react";
import { platformIcons } from "@/types/database";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const platformDetails: Record<string, { description: string; permissions: string[]; urlLabel: string; urlPlaceholder: string }> = {
  slack: {
    description: "Send notifications and read channel information from your Slack workspace.",
    permissions: ["Send messages to channels", "Read channel list", "Read user profiles"],
    urlLabel: "Workspace URL",
    urlPlaceholder: "your-team.slack.com",
  },
  salesforce: {
    description: "Create and update records, read contacts, and sync opportunity data.",
    permissions: ["Read/write contacts & accounts", "Read/write opportunities", "Read reports"],
    urlLabel: "Instance URL",
    urlPlaceholder: "your-company.salesforce.com",
  },
  hubspot: {
    description: "Monitor deal pipelines, sync contacts, and trigger workflow events.",
    permissions: ["Read deals & pipelines", "Read/write contacts", "Webhook subscriptions"],
    urlLabel: "Portal ID",
    urlPlaceholder: "12345678",
  },
  jira: {
    description: "Create issues, track sprint progress, and manage project boards.",
    permissions: ["Create/update issues", "Read project boards", "Read sprint data"],
    urlLabel: "Site URL",
    urlPlaceholder: "your-team.atlassian.net",
  },
  google_workspace: {
    description: "Schedule calendar events, send emails, and manage Google Drive files.",
    permissions: ["Manage Calendar events", "Send Gmail on your behalf", "Read Drive files"],
    urlLabel: "Google Account",
    urlPlaceholder: "you@company.com",
  },
  asana: {
    description: "Create tasks, manage projects, and track team workload.",
    permissions: ["Create/update tasks", "Read projects & workspaces", "Manage assignees"],
    urlLabel: "Workspace",
    urlPlaceholder: "your-workspace.asana.com",
  },
  notion: {
    description: "Create pages, update databases, and sync knowledge base content.",
    permissions: ["Read/write pages", "Read/write databases", "Search content"],
    urlLabel: "Workspace",
    urlPlaceholder: "your-workspace",
  },
  github: {
    description: "Create issues, manage pull requests, and track repository events.",
    permissions: ["Read/write issues", "Read pull requests", "Repository webhooks"],
    urlLabel: "Organization",
    urlPlaceholder: "your-org",
  },
};

interface IntegrationConnectModalProps {
  platform: string | null;
  onClose: () => void;
  onConnect: (platform: string) => Promise<void>;
}

export function IntegrationConnectModal({ platform, onClose, onConnect }: IntegrationConnectModalProps) {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  if (!platform) return null;

  const details = platformDetails[platform];
  const icon = platformIcons[platform];

  const handleAuthorize = async () => {
    setConnecting(true);
    // Simulate OAuth delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await onConnect(platform);
    setConnected(true);
    setTimeout(() => {
      setConnected(false);
      setConnecting(false);
      onClose();
    }, 1000);
  };

  return (
    <Dialog open={!!platform} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{icon?.emoji ?? "\u2699\uFE0F"}</span>
            Connect {icon?.label ?? platform}
          </DialogTitle>
        </DialogHeader>

        {connected ? (
          <div className="flex flex-col items-center py-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 mb-3">
              <Check className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-primary">Connected!</p>
          </div>
        ) : connecting ? (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Connecting to {icon?.label ?? platform}...</p>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              NexaFlow will connect to your {icon?.label ?? platform} account. {details?.description ?? ""}
            </p>

            {details?.permissions && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">Permissions requested:</p>
                <ul className="space-y-1.5">
                  {details.permissions.map((perm) => (
                    <li key={perm} className="flex items-center gap-2 text-sm text-secondary">
                      <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                      {perm}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {details && (
              <div className="space-y-2">
                <Label className="text-xs">{details.urlLabel} (optional)</Label>
                <Input
                  placeholder={details.urlPlaceholder}
                  className="bg-background border-border text-sm"
                />
              </div>
            )}

            <div className="flex items-start gap-2 rounded-lg bg-background p-3">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Your credentials are encrypted and stored securely. NexaFlow never stores your password.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 border-border" onClick={onClose}>
                Cancel
              </Button>
              <Button className="flex-1 gradient-primary text-primary-foreground" onClick={handleAuthorize}>
                Authorize & Connect
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

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
    <Dialog open={!!platform} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Disconnect {icon?.label ?? platform}?</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Disconnecting may cause workflows that use {icon?.label ?? platform} to fail. You can reconnect at any time.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 border-border" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDisconnect}
              disabled={disconnecting}
            >
              {disconnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Disconnect"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
