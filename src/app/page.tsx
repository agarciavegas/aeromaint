'use client';

import { useState, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { SidebarNav } from '@/components/airworthiness/sidebar-nav';
import { DashboardPanel } from '@/components/airworthiness/dashboard-panel';
import { AircraftPanel } from '@/components/airworthiness/aircraft-panel';
import { WorkOrdersPanel } from '@/components/airworthiness/work-orders-panel';
import { ModelsPanel } from '@/components/airworthiness/models-panel';
import { CreateAircraftDialog } from '@/components/airworthiness/create-aircraft-dialog';
import { CreateWorkOrderDialog } from '@/components/airworthiness/create-work-order-dialog';
import { CreateModelDialog } from '@/components/airworthiness/create-model-dialog';
import { UpdateHoursDialog } from '@/components/airworthiness/update-hours-dialog';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { currentPanel, sidebarOpen, setSidebarOpen, selectedWorkOrderId, selectWorkOrder } = useAppStore();
  const [createAircraftOpen, setCreateAircraftOpen] = useState(false);
  const [createWorkOrderOpen, setCreateWorkOrderOpen] = useState(false);
  const [createModelOpen, setCreateModelOpen] = useState(false);
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
      default:
        return <DashboardPanel key={`dash-${refreshKey}`} />;
    }
  };

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
