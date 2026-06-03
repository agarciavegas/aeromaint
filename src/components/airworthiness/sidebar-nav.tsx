'use client';

import {
  LayoutDashboard,
  Plane,
  ClipboardList,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore, type Panel } from '@/store/app-store';
import { cn } from '@/lib/utils';

const navItems: { id: Panel; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard },
  { id: 'aircraft', label: 'Aeronaves', icon: Plane },
  { id: 'workorders', label: 'Ordenes de Trabajo', icon: ClipboardList },
  { id: 'models', label: 'Modelos', icon: BookOpen },
];

interface SidebarNavProps {
  className?: string;
}

export function SidebarNav({ className }: SidebarNavProps) {
  const { currentPanel, setPanel, sidebarOpen, setSidebarOpen } = useAppStore();

  return (
    <div
      className={cn(
        'flex flex-col bg-zinc-900 text-zinc-100 transition-all duration-300 h-full',
        sidebarOpen ? 'w-56' : 'w-16',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-zinc-700">
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-emerald-400" />
            <span className="font-bold text-sm tracking-wide">AeroMaint</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPanel === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPanel(item.id)}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-emerald-600/20 text-emerald-400'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      {sidebarOpen && (
        <div className="px-4 py-3 border-t border-zinc-700">
          <p className="text-[10px] text-zinc-500">Gestión de Aeronavegabilidad v1.0</p>
        </div>
      )}
    </div>
  );
}
