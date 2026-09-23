import { useEffect, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, LogOut, Menu, Sprout } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import {
  getRouteJourney,
  getRouteLabel,
  getNavGroups,
  type ShellVariant,
  ServeWiseMark,
} from "@/lib/servewise-navigation";

type ShellContext = {
  email: string | null;
  organizationName: string;
  role: "admin" | "member";
  variant: ShellVariant;
};

type AppShellProps = ShellContext & {
  children: ReactNode;
};

const roleLabel = { admin: "Admin", member: "Member" } as const;

export function AppShell({ children, ...ctx }: AppShellProps) {
  return (
    <SidebarProvider>
      <div className="flex h-dvh max-h-dvh min-h-0 min-w-0 w-full overflow-hidden bg-background">
        <AppSidebar {...ctx} />
        <SidebarInset className="h-full min-h-0 min-w-0 overflow-x-hidden overflow-y-auto overscroll-y-contain bg-surface">
          <AppHeader {...ctx} />
          <main className="min-w-0 flex-1 bg-surface px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </SidebarInset>
        <Toaster position="top-right" closeButton richColors />
      </div>
    </SidebarProvider>
  );
}

function AppSidebar({ email, organizationName, role, variant }: ShellContext) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  return (
    <Sidebar collapsible="none" className="border-r border-sidebar-border">
      <SidebarHeader className="gap-3 border-b border-sidebar-border p-3">
        <Link
          to={variant === "ngo" ? "/ngo" : "/dashboard"}
          className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-md p-1 transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          onClick={() => setOpenMobile(false)}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-sidebar-border bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
            <ServeWiseMark className="h-7 w-7" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-sidebar-foreground">
              ServeWise
            </span>
            <span className="block truncate text-xs text-sidebar-foreground/65">
              {variant === "ngo" ? "Food recovery" : "Meal operations"}
            </span>
          </span>
        </Link>
        <div className="rounded-md border border-sidebar-border bg-sidebar-accent/55 px-3 py-2.5">
          <div className="flex items-center gap-2 text-xs font-medium text-sidebar-foreground/70">
            <Building2 className="h-3.5 w-3.5" />
            {variant === "ngo" ? "Recipient organization" : "Kitchen context"}
          </div>
          <p className="mt-1 truncate text-sm font-semibold text-sidebar-foreground">
            {organizationName}
          </p>
          <p className="mt-0.5 truncate text-xs text-sidebar-foreground/65">
            {roleLabel[role]} access
          </p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {Object.entries(getNavGroups(variant)).map(([group, items]) => (
          <SidebarGroup key={group} className="px-3 py-2">
            <SidebarGroupLabel>{group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {(items ?? []).map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    (pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname) === item.href;

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
        <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-md border border-sidebar-border bg-sidebar-accent/55 px-2 py-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-sidebar text-sidebar-primary">
            <Sprout className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-sidebar-foreground">
              {email ?? "Signed in"}
            </span>
            <span className="block truncate text-xs text-sidebar-foreground/65">
              {roleLabel[role]} · {organizationName}
            </span>
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function AppHeader({ email, organizationName, role, variant }: ShellContext) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { isMobile, setOpenMobile } = useSidebar();
  const currentLabel = getRouteLabel(pathname);
  const currentJourney = getRouteJourney(pathname);

  return (
    <header className="sticky top-0 z-20 border-b bg-surface-raised/95 backdrop-blur supports-[backdrop-filter]:bg-surface-raised/85">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        {isMobile && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 lg:hidden"
              aria-label="Open navigation"
              onClick={() => setOpenMobile(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
          </>
        )}

        <div className="min-w-0 flex-1">
          <nav
            className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground"
            aria-label="Breadcrumb"
          >
            <Link
              to={variant === "ngo" ? "/ngo" : "/dashboard"}
              className="truncate hover:text-foreground"
            >
              ServeWise
            </Link>
            <span aria-hidden="true">/</span>
            <span className="truncate">{currentJourney}</span>
            <span aria-hidden="true">/</span>
            <span className="truncate text-foreground">{currentLabel}</span>
          </nav>
          <p className="mt-1 truncate text-sm font-medium text-foreground">{currentLabel}</p>
        </div>

        <div className="flex shrink-0 items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="touch" className="max-w-[11rem] gap-2 px-2 sm:px-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
                  <Sprout className="h-4 w-4" />
                </span>
                <span className="hidden min-w-0 text-left sm:block">
                  <span className="block truncate text-xs font-medium">{email ?? "Signed in"}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {roleLabel[role]}
                  </span>
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <span className="block text-sm">{organizationName}</span>
                <span className="block truncate text-xs font-normal text-muted-foreground">
                  {email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={variant === "ngo" ? "/ngo/settings" : "/settings"}>Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleSignOut}>
                <LogOut className="h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
