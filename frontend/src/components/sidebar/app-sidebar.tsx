"use server";
import { UserButton } from "@daveyplate/better-auth-ui";
import { Sparkles, User } from "lucide-react";
import Link from "next/link";
import Credits from "~/components/sidebar/credits";
import MobileSidebarClose from "~/components/sidebar/mobile-sidebar-close";
import SidebarMenuItems from "~/components/sidebar/sidebar-menu-items";
import Upgrade from "~/components/sidebar/upgrade";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "~/components/ui/sidebar";

export default async function AppSidebar() {
  return (
    <Sidebar className="from-background to-muted/20 border-r-0 bg-gradient-to-b">
      <SidebarContent className="px-3">
        <MobileSidebarClose />
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary mt-6 mb-8 flex flex-col items-start justify-start px-2">
            <Link
              href="/"
              className="item-center mb-1 flex cursor-pointer gap-2"
            >
              <Sparkles className="text-primary h-6 w-6"></Sparkles>
              <p className="from-primary to-primary/60 bg-gradient-to-r bg-clip-text text-2xl font-bold tracking-tight text-transparent">
                AI Voice
              </p>
            </Link>
            <p className="text-foreground ml-8 text-sm font-medium tracking-wide">
              Studio
            </p>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItems />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="bg-muted/30 border-t p-3">
        <div className="mb-3 flex w-full items-center justify-center gap-2 text-xs">
          <Credits></Credits>
          <Upgrade></Upgrade>
        </div>

        <UserButton
          variant="outline"
          className="border-muted-foreground/20 hover:border-primary/50 w-full transition-colors"
          disableDefaultLinks={true}
          additionalLinks={[
            {
              label: "Customer Portal",
              href: "/dashboard/customer-portal",
              icon: <User className="h-4 w-4" />,
            },
            {
              label: "Settings",
              href: "/dashboard/settings",
              icon: <User className="h-4 w-4" />,
            },
          ]}
        ></UserButton>
      </SidebarFooter>
    </Sidebar>
  );
}
