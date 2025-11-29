"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useScrollFixed } from "@/hooks/useScrollFixed";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings, Menu, X, Shield } from "lucide-react";

interface AdminHeaderProps {
  onMenuClick: () => void;
  isMenuOpen: boolean;
}

export function AdminHeader({ onMenuClick, isMenuOpen }: AdminHeaderProps) {
  const { data: session } = useSession();
  const isFixed = useScrollFixed(10);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <header
      className={`bg-white shadow-sm border-b z-50 ${isFixed ? "sticky top-0" : ""}`}
    >
      <div className="px-4 py-3">
        {/* Mobile-first layout */}
        <div className="flex items-center justify-between">
          {/* Left: Menu button and Logo */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onMenuClick}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 text-gray-700" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700" />
              )}
            </button>

            <div className="flex items-center space-x-2">
              <div className="townkart-gradient p-2 rounded-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            </div>
          </div>

          {/* Right: User Menu */}
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={session?.user?.image || ""}
                      alt={session?.user?.name || ""}
                    />
                    <AvatarFallback>
                      {session?.user?.name?.charAt(0)?.toUpperCase() || "A"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session?.user?.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session?.user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Desktop Navigation - Hidden on mobile */}
        <nav className="hidden md:flex items-center justify-center space-x-8 mt-3">
          <span className="text-gray-700 font-medium">Dashboard</span>
          <span className="text-gray-700 font-medium">Users</span>
          <span className="text-gray-700 font-medium">Orders</span>
          <span className="text-gray-700 font-medium">Analytics</span>
        </nav>
      </div>
    </header>
  );
}
