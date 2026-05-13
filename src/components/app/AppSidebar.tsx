'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import HazardPanel from '@/components/app/HazardPanel';
import VesselList from '@/components/AIS/VesselList';

type AppSidebarProps = React.ComponentProps<'div'> & {
  variant?: 'sidebar' | 'floating' | 'inset';
};

export default function AppSidebar({ variant, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas" variant={variant} {...props}>
      <SidebarHeader className="border-b border-sidebar-border px-0 py-0">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <HazardPanel />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarHeader>

      <SidebarSeparator />

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
