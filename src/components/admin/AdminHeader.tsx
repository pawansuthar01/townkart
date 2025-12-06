"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <header className={`bg-white fixed shadow-sm border-b w-full z-50`}>
      <div className="px-4 py-3">
        {/* Mobile-first layout */}
        <div className="flex items-center justify-between">
          {/* Left: Menu button and Logo */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onMenuClick}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
          <Link
            href="/admin/dashboard"
            className="text-gray-700 hover:text-townkart-primary transition-colors font-medium"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/users"
            className="text-gray-700 hover:text-townkart-primary transition-colors font-medium"
          >
            Users
          </Link>
          <Link
            href="/admin/orders"
            className="text-gray-700 hover:text-townkart-primary transition-colors font-medium"
          >
            Orders
          </Link>
          <Link
            href="/admin/analytics"
            className="text-gray-700 hover:text-townkart-primary transition-colors font-medium"
          >
            Analytics
          </Link>
        </nav>
      </div>
    </header>
  );
}
