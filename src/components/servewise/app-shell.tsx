import { useEffect, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Building2, Menu, Sprout } from "lucide-react";

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
  groupedServeWiseNavItems,
  ServeWiseMark,
} from "@/lib/servewise-navigation";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen min-w-0 w-full bg-background">
        <AppSidebar />
        <SidebarInset className="min-w-0 bg-surface">
          <AppHeader />
          <main className="min-w-0 flex-1 bg-surface px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </SidebarInset>
        <Toaster position="top-right" closeButton richColors />
      </div>
    </SidebarProvider>
  );
}

function AppSidebar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  return (
    <Sidebar collapsible="none" className="border-r border-sidebar-border">
      <SidebarHeader className="gap-3 border-b border-sidebar-border p-3">
        <Link
          to="/dashboard"
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
              Meal operations
            </span>
          </span>
        </Link>
        <div className="rounded-md border border-sidebar-border bg-sidebar-accent/55 px-3 py-2.5">
          <div className="flex items-center gap-2 text-xs font-medium text-sidebar-foreground/70">
            <Building2 className="h-3.5 w-3.5" />
            Kitchen context
          </div>
          <p className="mt-1 truncate text-sm font-semibold text-sidebar-foreground">
            Demo Kitchen Group
          </p>
          <p className="mt-0.5 truncate text-xs text-sidebar-foreground/65">
            Main kitchen · Lunch service
          </p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {Object.entries(groupedServeWiseNavItems).map(([group, items]) => (
          <SidebarGroup key={group} className="px-3 py-2">
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
        <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-md border border-sidebar-border bg-sidebar-accent/55 px-2 py-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-sidebar text-sidebar-primary">
            <Sprout className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-sidebar-foreground">
              Kitchen operator
            </span>
            <span className="block truncate text-xs text-sidebar-foreground/65">
              Demo Kitchen Group
            </span>
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function AppHeader() {
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
              className="h-10 w-10 shrink-0 md:hidden"
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
            <Link to="/dashboard" className="truncate hover:text-foreground">
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
                  <span className="block truncate text-xs font-medium">Kitchen operator</span>
                  <span className="block truncate text-xs text-muted-foreground">Demo profile</span>
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <span className="block text-sm">Demo Kitchen Group</span>
                <span className="block text-xs font-normal text-muted-foreground">
                  Main kitchen · Lunch service
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings">Operator profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings">Kitchen settings</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
