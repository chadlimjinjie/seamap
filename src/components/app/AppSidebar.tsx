'use client';

import { Anchor, Zap } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import HazardPanel from '@/components/app/HazardPanel';
import VesselList from '@/components/AIS/VesselList';

type AppSidebarProps = React.ComponentProps<'div'> & {
  variant?: 'sidebar' | 'floating' | 'inset';
};

export default function AppSidebar({ variant, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas" variant={variant} {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="cursor-default select-none">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Anchor className="size-4" />
              </div>
              <span className="font-semibold text-base">SeaMap</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Quick Create"
              className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
            >
              <Zap className="size-4" />
              <span>Quick Action</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarHeader className="border-b border-sidebar-border px-0 py-0">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <HazardPanel />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarHeader>

      <SidebarContent className="overflow-hidden">
        <SidebarGroup className="p-0 h-full flex flex-col">
          <SidebarGroupContent className="flex-1 min-h-0">
            <VesselList />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
