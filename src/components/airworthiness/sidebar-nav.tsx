'use client';

import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Plane,
  ClipboardList,
  BookOpen,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ShieldCheck,
  Shield,
  Wrench,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore, type Panel } from '@/store/app-store';
import { cn } from '@/lib/utils';

const baseNavItems: { id: Panel; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard },
  { id: 'aircraft', label: 'Aeronaves', icon: Plane },
  { id: 'workorders', label: 'Ordenes de Trabajo', icon: ClipboardList },
  { id: 'models', label: 'Modelos', icon: BookOpen },
];

const usersNavItem: { id: Panel; label: string; icon: React.ElementType } = {
  id: 'users',
  label: 'Usuarios',
  icon: Users,
};

const roleLabels: Record<string, { label: string; icon: React.ElementType }> = {
  admin: { label: 'Administrador', icon: ShieldCheck },
  manager: { label: 'Jefe Mant.', icon: Shield },
  technician: { label: 'Técnico', icon: Wrench },
  viewer: { label: 'Observador', icon: Eye },
};

interface SidebarNavProps {
  className?: string;
}

export function SidebarNav({ className }: SidebarNavProps) {
  const { currentPanel, setPanel, sidebarOpen, setSidebarOpen } = useAppStore();
  const { data: session } = useSession();

  const userRole = (session?.user as any)?.role;
  const userName = session?.user?.name || '';
  const showUsers = userRole === 'admin' || userRole === 'manager';

  const navItems = showUsers ? [...baseNavItems, usersNavItem] : baseNavItems;

  const roleInfo = roleLabels[userRole] || roleLabels.viewer;
  const RoleIcon = roleInfo.icon;

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

      {/* Footer with user info and logout */}
      <div className="border-t border-zinc-700">
        {sidebarOpen && session && (
          <div className="px-3 py-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-zinc-800">
                <RoleIcon className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-zinc-200 truncate">{userName}</p>
                <p className="text-[10px] text-zinc-500">{roleInfo.label}</p>
              </div>
            </div>
          </div>
        )}
        <div className="px-2 pb-3 pt-1">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium transition-colors',
              'text-zinc-500 hover:text-red-400 hover:bg-zinc-800'
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span>Cerrar Sesión</span>}
          </button>
        </div>
        {sidebarOpen && (
          <div className="px-4 py-2 border-t border-zinc-700">
            <p className="text-[10px] text-zinc-600">Gestión de Aeronavegabilidad v1.0</p>
          </div>
        )}
      </div>
    </div>
  );
}
