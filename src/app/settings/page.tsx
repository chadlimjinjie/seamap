'use client';

import Link from 'next/link';
import { ArrowLeft, Satellite, Radio, Sun, Moon, Monitor, Layout } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import GPSPanel from '@/components/app/GPSPanel';
import ConnectionPanel from '@/components/AIS/ConnectionPanel';
import { useSettingsStore, CORNER_CLASSES } from '@/lib/store/settingsStore';
import type { Corner, OverlayPositions } from '@/lib/store/settingsStore';

function SettingsCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-start gap-3">
        <div className="mt-0.5 text-muted-foreground">{icon}</div>
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}

function ThemeCard() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: 'light', label: 'Light', icon: <Sun className="w-4 h-4" /> },
    { value: 'dark',  label: 'Dark',  icon: <Moon className="w-4 h-4" /> },
    { value: 'system', label: 'System', icon: <Monitor className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="p-4 flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          className={`flex-1 flex flex-col items-center gap-1.5 rounded-lg border py-3 text-xs font-medium transition-colors
            ${theme === opt.value
              ? 'border-primary bg-primary/10 text-foreground'
              : 'border-border text-muted-foreground hover:border-primary/50'}`}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

const CORNER_LABELS: Record<Corner, { label: string; arrow: string }> = {
  'top-left':     { label: 'Top left',     arrow: '↖' },
  'top-right':    { label: 'Top right',    arrow: '↗' },
  'bottom-left':  { label: 'Bottom left',  arrow: '↙' },
  'bottom-right': { label: 'Bottom right', arrow: '↘' },
};

const CORNERS: Corner[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

const OVERLAY_LABELS: { key: keyof OverlayPositions; label: string }[] = [
  { key: 'compass',     label: 'Compass' },
  { key: 'harbour',     label: 'Nearest Harbour' },
  { key: 'hazardDetail', label: 'Hazard Detail' },
];

function CornerPicker({ value, onChange }: { value: Corner; onChange: (c: Corner) => void }) {
  return (
    <div className="grid grid-cols-2 gap-1 w-[88px]">
      {CORNERS.map((c) => (
        <button
          key={c}
          title={CORNER_LABELS[c].label}
          onClick={() => onChange(c)}
          className={`flex items-center justify-center rounded text-base h-9 transition-colors
            ${value === c
              ? 'bg-primary/15 border border-primary text-foreground'
              : 'border border-border text-muted-foreground hover:border-primary/50'}`}
        >
          {CORNER_LABELS[c].arrow}
        </button>
      ))}
    </div>
  );
}

function OverlaysCard() {
  const positions = useSettingsStore((s) => s.overlayPositions);
  const setOverlayPosition = useSettingsStore((s) => s.setOverlayPosition);
  const resetOverlayPositions = useSettingsStore((s) => s.resetOverlayPositions);

  return (
    <div className="divide-y divide-border">
      {OVERLAY_LABELS.map(({ key, label }) => (
        <div key={key} className="px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium">{label}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {CORNER_LABELS[positions[key]].label}
            </div>
          </div>
          <CornerPicker value={positions[key]} onChange={(c) => setOverlayPosition(key, c)} />
        </div>
      ))}
      <div className="px-4 py-2.5 flex justify-end">
        <button
          onClick={resetOverlayPositions}
          className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="h-12 border-b border-border flex items-center px-6 gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          render={<Link href="/" />}
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back to map
        </Button>
        <span className="text-sm font-semibold">Settings</span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsCard
            icon={<Satellite className="w-4 h-4" />}
            title="GPS"
            description="Browser geolocation — shows your position on the map and refines hazard distances."
          >
            <GPSPanel />
          </SettingsCard>

          <SettingsCard
            icon={<Radio className="w-4 h-4" />}
            title="AIS Receiver"
            description="Connect a USB AIS receiver via Web Serial to track nearby vessels in real time."
          >
            <ConnectionPanel />
          </SettingsCard>

          <SettingsCard
            icon={<Sun className="w-4 h-4" />}
            title="Appearance"
            description="Choose between light, dark, or system theme."
          >
            <ThemeCard />
          </SettingsCard>

          <SettingsCard
            icon={<Layout className="w-4 h-4" />}
            title="Overlays"
            description="Choose which corner each map overlay appears in."
          >
            <OverlaysCard />
          </SettingsCard>
        </div>
      </main>
    </div>
  );
}
