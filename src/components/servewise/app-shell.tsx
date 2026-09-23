import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Building2, ChevronDown, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getRouteLabel, groupedServeWiseNavItems, ServeWiseMark } from "@/lib/servewise-navigation";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset className="min-w-0 bg-background">
          <AppHeader />
          <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">{children}</div>
          </main>
        </SidebarInset>
        <Toaster position="top-right" closeButton richColors />
      </div>
    </SidebarProvider>
  );
}

function AppSidebar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { setOpenMobile, state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader className="gap-3 p-3">
        <Link
          to="/dashboard"
          className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-md p-2 transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          onClick={() => setOpenMobile(false)}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <ServeWiseMark className="h-5 w-5" />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-sidebar-foreground">
                ServeWise
              </span>
              <span className="block truncate text-xs text-sidebar-foreground/65">
                Cafeteria operations
              </span>
            </span>
          )}
        </Link>
        {!collapsed && (
          <div className="rounded-md border border-sidebar-border bg-sidebar-accent/55 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-sidebar-foreground/70">
              <Building2 className="h-3.5 w-3.5" />
              Organization
            </div>
            <p className="mt-1 truncate text-sm font-semibold text-sidebar-foreground">
              Demo Kitchen Group
            </p>
            <p className="mt-0.5 truncate text-xs text-sidebar-foreground/65">
              C1 frontend foundation
            </p>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        {Object.entries(groupedServeWiseNavItems).map(([group, items]) => (
          <SidebarGroup key={group}>
            <SidebarGroupLabel>{group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href || (pathname === "/" && item.href === "/dashboard");

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                        <Link
                          to={item.href}
                          className="min-w-0"
                          onClick={() => setOpenMobile(false)}
                          activeOptions={{ exact: true }}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="p-3">
        <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-md border border-sidebar-border bg-sidebar-accent/55 p-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-sidebar text-xs font-semibold text-sidebar-foreground">
            RS
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-sidebar-foreground">
                Operator profile
              </span>
              <span className="block truncate text-xs text-sidebar-foreground/65">
                Local demo session
              </span>
            </span>
          )}
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function AppHeader() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const currentLabel = getRouteLabel(pathname);

  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="grid min-h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarTrigger className="h-10 w-10" />
            </TooltipTrigger>
            <TooltipContent>Toggle navigation</TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="hidden h-6 sm:block" />
        </div>

        <div className="min-w-0">
          <nav
            className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground"
            aria-label="Breadcrumb"
          >
            <Link to="/dashboard" className="truncate hover:text-foreground">
              ServeWise
            </Link>
            <span aria-hidden="true">/</span>
            <span className="truncate text-foreground">{currentLabel}</span>
          </nav>
          <div className="mt-1 flex min-w-0 items-center gap-2">
            <p className="truncate text-sm font-medium text-foreground">{currentLabel}</p>
            <span className="hidden shrink-0 rounded-md border bg-surface-subtle px-2 py-0.5 text-xs text-muted-foreground sm:inline-flex">
              Foundation mode
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden w-64 items-center gap-2 rounded-md border bg-surface-raised px-3 py-2 lg:flex">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              aria-label="Search placeholder"
              disabled
              className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
              placeholder="Search connects later"
            />
          </div>
          <Button
            variant="ghost"
            size="iconTouch"
            aria-label="Show notifications"
            onClick={() => toast.info("Notifications are ready for later operational events.")}
          >
            <Bell className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="touch" className="max-w-[11rem] gap-2 px-2 sm:px-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
                  RS
                </span>
                <span className="hidden min-w-0 text-left sm:block">
                  <span className="block truncate text-xs font-medium">Kitchen operator</span>
                  <span className="block truncate text-xs text-muted-foreground">Demo profile</span>
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <span className="block text-sm">Demo Kitchen Group</span>
                <span className="block text-xs font-normal text-muted-foreground">
                  Profile and auth connect later
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() =>
                  toast.message("Profile settings will connect in a later checkpoint.")
                }
              >
                Profile foundation
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() =>
                  toast.message("Organization settings will connect in a later checkpoint.")
                }
              >
                Organization context
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
