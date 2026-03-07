import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useOrg } from "@/hooks/useOrg";
import {
  LayoutDashboard,
  GitBranch,
  Sparkles,
  Plug,
  BarChart3,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: GitBranch, label: "Workflows", path: "/dashboard/workflows" },
  { icon: Sparkles, label: "AI Builder", path: "/dashboard/workflows/new" },
  { icon: Plug, label: "Integrations", path: "/dashboard/integrations" },
  { icon: BarChart3, label: "Analytics", path: "/dashboard/analytics" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
];

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { org } = useOrg();

  const creditBalance = org?.credit_balance ?? 0;
  const creditLimit = org?.monthly_credit_limit ?? 500;
  const creditPct = creditLimit > 0 ? (creditBalance / creditLimit) * 100 : 0;

  const isActive = (path: string) =>
    path === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(path);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-4">
        <div className="gradient-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-primary-foreground">
          N
        </div>
        {!collapsed && <span className="text-lg font-bold text-foreground">NexaFlow</span>}
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="ml-auto md:hidden text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
              isActive(item.path)
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Credits */}
      {!collapsed && (
        <div className="border-t border-border p-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Credits</span>
            <span className={`font-mono font-medium ${creditBalance < 100 ? "text-destructive" : creditBalance < 500 ? "text-warning" : "text-primary"}`}>
              {creditBalance.toLocaleString()} / {creditLimit.toLocaleString()}
            </span>
          </div>
          <Progress value={creditPct} className={`h-1.5 bg-secondary [&>div]:${creditBalance < 100 ? "bg-destructive" : creditBalance < 500 ? "bg-warning" : "bg-primary"}`} />
        </div>
      )}

      {/* Bottom */}
      <div className="border-t border-border p-3 space-y-1">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          {!collapsed && <span>Back to site</span>}
        </Link>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — desktop */}
      <aside
        className={`sticky top-0 hidden md:flex h-screen flex-col border-r border-border bg-card transition-all duration-200 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {sidebarContent}
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </aside>

      {/* Sidebar — mobile */}
      <aside
        className={`fixed top-0 left-0 z-50 flex h-screen w-60 flex-col border-r border-border bg-card transition-transform duration-200 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-6 backdrop-blur-xl">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <button className="relative text-muted-foreground hover:text-foreground transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-destructive" />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
            {user?.email?.[0]?.toUpperCase() ?? "U"}
          </div>
        </header>

        <main className="flex-1 p-6 page-transition">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
