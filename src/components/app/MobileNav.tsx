'use client';

import { Ship, AlertTriangle } from 'lucide-react';
import { useVesselStore } from '@/lib/store/vesselStore';

type Panel = 'vessels' | 'hazards' | null;

interface Props {
  active: Panel;
  onToggle: (panel: 'vessels' | 'hazards') => void;
}

export default function MobileNav({ active, onToggle }: Props) {
  const vesselCount = useVesselStore((s) => s.vessels.size);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-card/95 backdrop-blur-sm border-t border-border flex z-20">
      <NavTab
        icon={<Ship className="w-5 h-5" />}
        label="Vessels"
        badge={vesselCount > 0 ? vesselCount : undefined}
        active={active === 'vessels'}
        onClick={() => onToggle('vessels')}
      />
      <NavTab
        icon={<AlertTriangle className="w-5 h-5" />}
        label="Hazards"
        active={active === 'hazards'}
        onClick={() => onToggle('hazards')}
      />
    </nav>
  );
}

function NavTab({
  icon,
  label,
  badge,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors relative
        ${active ? 'text-foreground' : 'text-muted-foreground'}`}
    >
      <div className="relative">
        {icon}
        {badge != null && (
          <span className="absolute -top-1.5 -right-2.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full min-w-[14px] h-3.5 px-0.5 flex items-center justify-center leading-none">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      {label}
      {active && (
        <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-foreground rounded-full" />
      )}
    </button>
  );
}
