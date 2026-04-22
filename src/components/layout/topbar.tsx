"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";
import { useNotifications } from "@/hooks/use-notifications";
import { Bell, Search, LogOut, User, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export function TopBar() {
  const { user, logout } = useAuth();
  const { isAdmin } = useRole();
  const { unreadCount } = useNotifications();

  const initials = user?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-4">
      <Link href="/dashboard" className="text-lg font-bold text-slate-900">
        VC Firm
      </Link>

      <div className="hidden md:flex items-center gap-2 rounded-md bg-slate-100 px-3 py-1.5 text-sm text-slate-400">
        <Search className="h-4 w-4" />
        <span>Search (coming soon)</span>
      </div>

      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="relative p-1">
            <Bell className="h-5 w-5 text-slate-500" />
            {unreadCount > 0 && (
              <Badge className="absolute -right-1 -top-1 h-4 w-4 rounded-full p-0 text-[10px] flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="p-2 text-sm font-medium">Notifications</div>
            <DropdownMenuSeparator />
            <div className="max-h-64 overflow-y-auto p-2 text-sm text-slate-500">
              {unreadCount === 0 ? "No new notifications" : "Loading notifications..."}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.fullName}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center gap-2">
                <User className="h-4 w-4" /> Profile
              </Link>
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem asChild>
                <Link href="/admin/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" /> Settings
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => logout()}
              className="flex items-center gap-2 text-red-600"
            >
              <LogOut className="h-4 w-4" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
