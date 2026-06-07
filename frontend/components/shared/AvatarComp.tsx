import { User as IUser } from "next-auth";
import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreditCard, LogOut, Settings, User } from "lucide-react";
import { signOutAction } from "@/lib/auth/actions";

export const AvatarComp = ({ user }: { user: IUser }) => {
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface transition-colors outline-none">
        <Avatar className="w-8 h-8">
          <AvatarImage
            src={user.image ?? undefined}
            alt={user.name as string}
          />
          <AvatarFallback className="bg-[--sidebar-active] text-[--sidebar-active-text] text-xs font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-2 border-b border-[--border] mb-1">
          <p className="text-sm font-medium text-[--text-primary]">
            {user.name}
          </p>
          <p className="text-xs text-[--text-muted] mt-0.5">{user.email}</p>
        </div>

        <DropdownMenuItem>
          <a
            href="/dashboard/profile"
            className="flex items-center gap-2 cursor-pointer"
          >
            <User className="w-4 h-4" />
            Profile
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <a
            href="/dashboard/settings"
            className="flex items-center gap-2 cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            Settings
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <a
            href="/dashboard/settings/billing"
            className="flex items-center gap-2 cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            Billing
          </a>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem>
          <form action={signOutAction} className="w-full">
            <button
              type="submit"
              className="flex items-center gap-2 w-full text-red-500"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// export  AvatarComp;
