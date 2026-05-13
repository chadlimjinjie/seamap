'use client';

import Link from 'next/link';
import { ArrowLeft, Satellite, Radio, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import GPSPanel from '@/components/app/GPSPanel';
import ConnectionPanel from '@/components/AIS/ConnectionPanel';

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
        </div>
      </main>
    </div>
  );
}
