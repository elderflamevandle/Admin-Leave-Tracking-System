"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "@/hooks/use-role";
import { getNavGroups } from "./nav-items";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ChevronLeft, ChevronRight } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useState } from "react";

export function Sidebar() {
  const { roleName } = useRole();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-collapsed") === "true";
    }
    return false;
  });

  if (!roleName) return null;
  const navGroups = getNavGroups(roleName);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  const getIcon = (name: string) => {
    const Icon = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[name];
    return Icon ? <Icon className="h-4 w-4 shrink-0" /> : null;
  };

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r bg-white transition-all duration-200",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex h-14 items-center border-b px-4">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-2 text-sm font-medium",
            pathname === "/dashboard" && "text-blue-600"
          )}
        >
          <LayoutDashboard className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Dashboard</span>}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            {!collapsed && (
              <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-slate-600 hover:bg-slate-100",
                    item.comingSoon && "opacity-60"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  {getIcon(item.icon)}
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {item.comingSoon && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                          Soon
                        </Badge>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <button
        onClick={toggleCollapsed}
        className="flex h-10 items-center justify-center border-t text-slate-400 hover:text-slate-600"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
