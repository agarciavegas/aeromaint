'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAppStore } from '@/store/app-store';
import { SidebarNav } from '@/components/airworthiness/sidebar-nav';
import { DashboardPanel } from '@/components/airworthiness/dashboard-panel';
import { AircraftPanel } from '@/components/airworthiness/aircraft-panel';
import { WorkOrdersPanel } from '@/components/airworthiness/work-orders-panel';
import { ModelsPanel } from '@/components/airworthiness/models-panel';
import { UsersPanel } from '@/components/airworthiness/users-panel';
import { CreateAircraftDialog } from '@/components/airworthiness/create-aircraft-dialog';
import { CreateWorkOrderDialog } from '@/components/airworthiness/create-work-order-dialog';
import { CreateModelDialog } from '@/components/airworthiness/create-model-dialog';
import { CreateUserDialog } from '@/components/airworthiness/create-user-dialog';
import { UpdateHoursDialog } from '@/components/airworthiness/update-hours-dialog';
import { Menu, ShieldCheck, Shield, Wrench, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const roleConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  admin: { label: 'Admin', color: 'bg-red-50 text-red-600 border-red-200', icon: ShieldCheck },
  manager: { label: 'Jefe', color: 'bg-amber-50 text-amber-600 border-amber-200', icon: Shield },
  technician: { label: 'Técnico', color: 'bg-sky-50 text-sky-600 border-sky-200', icon: Wrench },
  viewer: { label: 'Observador', color: 'bg-zinc-50 text-zinc-500 border-zinc-200', icon: Eye },
};

export default function Home() {
  const { data: session, status } = useSession();
  const { currentPanel, sidebarOpen, setSidebarOpen, selectedWorkOrderId, selectWorkOrder } = useAppStore();
  const [createAircraftOpen, setCreateAircraftOpen] = useState(false);
  const [createWorkOrderOpen, setCreateWorkOrderOpen] = useState(false);
  const [createModelOpen, setCreateModelOpen] = useState(false);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [updateHoursOpen, setUpdateHoursOpen] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [selectedAircraftIdForHours, setSelectedAircraftIdForHours] = useState<string | null>(null);
  const [selectedAircraftIdForWO, setSelectedAircraftIdForWO] = useState<string | null>(null);
  const [preselectedRuleIds, setPreselectedRuleIds] = useState<string[]>([]);
  const [aircraftData, setAircraftData] = useState<{ hours: number; cycles: number; registration: string }>({
    hours: 0,
    cycles: 0,
    registration: '',
  });
  const [refreshKey, setRefreshKey] = useState(0);

  const userRole = (session?.user as any)?.role;
  const userName = session?.user?.name;
  const roleInfo = roleConfig[userRole] || roleConfig.viewer;
  const RoleIcon = roleInfo.icon;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/login';
    }
  }, [status]);

  const handleUpdateHours = useCallback(async (aircraftId: string) => {
    try {
      const res = await fetch(`/api/aircraft/${aircraftId}`);
      const data = await res.json();
      setSelectedAircraftIdForHours(aircraftId);
      setAircraftData({
        hours: data.totalHours,
        cycles: data.totalCycles,
        registration: data.registration,
      });
      setUpdateHoursOpen(true);
    } catch (err) {
      console.error('Error fetching aircraft:', err);
    }
  }, []);

  const handleCreateWorkOrder = useCallback((ruleIds: string[], aircraftId: string) => {
    setPreselectedRuleIds(ruleIds);
    setSelectedAircraftIdForWO(aircraftId);
    setCreateWorkOrderOpen(true);
  }, []);

  const handleCreateAircraft = useCallback((modelId: string) => {
    setSelectedModelId(modelId);
    setCreateAircraftOpen(true);
  }, []);

  const triggerRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  const renderPanel = () => {
    switch (currentPanel) {
      case 'dashboard':
        return <DashboardPanel key={`dash-${refreshKey}`} />;
      case 'aircraft':
        return (
          <AircraftPanel
            key={`ac-${refreshKey}`}
            onUpdateHours={handleUpdateHours}
            onCreateWorkOrder={handleCreateWorkOrder}
          />
        );
      case 'workorders':
        return (
          <WorkOrdersPanel
            key={`wo-${refreshKey}`}
            onCreateWorkOrder={() => {
              setPreselectedRuleIds([]);
              setSelectedAircraftIdForWO(null);
              setCreateWorkOrderOpen(true);
            }}
            initialWorkOrderId={selectedWorkOrderId}
            refreshKey={refreshKey}
          />
        );
      case 'models':
        return (
          <ModelsPanel
            key={`models-${refreshKey}`}
            onCreateAircraft={handleCreateAircraft}
            onCreateModel={() => setCreateModelOpen(true)}
          />
        );
      case 'users':
        return (
          <UsersPanel
            key={`users-${refreshKey}`}
            onCreateUser={() => setCreateUserOpen(true)}
          />
        );
      default:
        return <DashboardPanel key={`dash-${refreshKey}`} />;
    }
  };

  // Show loading while checking auth
  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Sidebar */}
      <div className="hidden md:flex">
        <SidebarNav />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-56 h-full z-50">
            <SidebarNav />
          </div>
          <div
            className="flex-1 bg-black/30"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-white">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-sm font-medium text-zinc-500">AeroMaint — Gestión de Aeronavegabilidad</h2>
          </div>
          {session && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-[11px] ${roleInfo.color}`}>
                <RoleIcon className="h-3 w-3 mr-1" />
                {roleInfo.label}
              </Badge>
              <span className="text-xs text-zinc-500 hidden sm:inline">{userName}</span>
            </div>
          )}
        </header>

        {/* Panel content */}
        <main className="flex-1 overflow-y-auto">
          {renderPanel()}
        </main>
      </div>

      {/* Dialogs */}
      <CreateAircraftDialog
        open={createAircraftOpen}
        onOpenChange={setCreateAircraftOpen}
        modelId={selectedModelId}
        onCreated={triggerRefresh}
      />

      <CreateWorkOrderDialog
        open={createWorkOrderOpen}
        onOpenChange={setCreateWorkOrderOpen}
        preselectedRuleIds={preselectedRuleIds}
        preselectedAircraftId={selectedAircraftIdForWO || undefined}
        onCreated={triggerRefresh}
      />

      <CreateModelDialog
        open={createModelOpen}
        onOpenChange={setCreateModelOpen}
        onCreated={triggerRefresh}
      />

      <CreateUserDialog
        open={createUserOpen}
        onOpenChange={setCreateUserOpen}
        onCreated={triggerRefresh}
      />

      <UpdateHoursDialog
        open={updateHoursOpen}
        onOpenChange={setUpdateHoursOpen}
        aircraftId={selectedAircraftIdForHours}
        currentHours={aircraftData.hours}
        currentCycles={aircraftData.cycles}
        registration={aircraftData.registration}
        onUpdated={triggerRefresh}
      />
    </div>
  );
}
