import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  Image,
  Globe,
  Settings,
  ExternalLink,
  Gem,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

const navItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Products",
    href: "/admin/products",
    icon: Package,
  },
  {
    label: "Collections",
    href: "/admin/collections",
    icon: FolderOpen,
  },
  {
    label: "Media",
    href: "/admin/media",
    icon: Image,
  },
  {
    label: "Homepage",
    href: "/admin/homepage",
    icon: Globe,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

interface AdminSidebarProps {
  onClose?: () => void;
}

export function AdminSidebar({ onClose }: AdminSidebarProps) {
  const router = useRouterState();
  const currentPath = router.location.pathname;

  function isActive(href: string, exact?: boolean) {
    if (exact) return currentPath === href;
    return currentPath.startsWith(href);
  }

  return (
    <div className="flex flex-col h-full bg-[#1a0a2e] text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
          <img src={logo} alt="By Areeqaan" className="w-full h-full object-contain p-1" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-tight truncate">By Areeqaan</p>
          <p className="text-xs text-white/50 leading-tight">Admin Dashboard</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
                  active
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-900/40"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon
                  className={cn(
                    "w-4.5 h-4.5 shrink-0 transition-colors",
                    active ? "text-white" : "text-white/40 group-hover:text-white/80"
                  )}
                  size={18}
                />
                <span className="flex-1">{item.label}</span>
                {active && (
                  <ChevronRight size={14} className="text-white/60" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/10">
        <Link
          to="/"
          target="_blank"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:bg-white/10 hover:text-white transition-all duration-150 group"
        >
          <ExternalLink size={16} className="shrink-0" />
          <span>View Storefront</span>
          <ExternalLink size={12} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
        <div className="mt-3 px-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center shrink-0">
              <Gem size={14} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white/80 leading-tight truncate">Admin</p>
              <p className="text-[11px] text-white/40 leading-tight">Jewelry Manager</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
