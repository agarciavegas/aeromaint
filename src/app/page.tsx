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
import { UpdateHoursDialog } from '@/components/airworthiness/update-hours-dialog';
import { Menu, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { currentPanel, sidebarOpen, setSidebarOpen } = useAppStore();
  const [createAircraftOpen, setCreateAircraftOpen] = useState(false);
  const [createWorkOrderOpen, setCreateWorkOrderOpen] = useState(false);
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
  const [seeding, setSeeding] = useState(false);

  const handleUpdateHours = useCallback(async (aircraftId: string) => {
    try {
      const res = await fetch(`/api/aircraft/${aircraftId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedAircraftIdForHours(aircraftId);
        setAircraftData({
          hours: data.totalHours,
          cycles: data.totalCycles,
          registration: data.registration,
        });
        setUpdateHoursOpen(true);
      }
    } catch (err) {
      console.error('Error fetching aircraft for hours update:', err);
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

  const handleSeedDatabase = useCallback(async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error('Error seeding database:', err);
    } finally {
      setSeeding(false);
    }
  }, []);

  const renderPanel = () => {
    switch (currentPanel) {
      case 'dashboard':
        return <DashboardPanel />;
      case 'aircraft':
        return (
          <AircraftPanel
            onUpdateHours={handleUpdateHours}
            onCreateWorkOrder={handleCreateWorkOrder}
          />
        );
      case 'workorders':
        return (
          <WorkOrdersPanel
            onCreateWorkOrder={() => {
              setPreselectedRuleIds([]);
              setSelectedAircraftIdForWO(null);
              setCreateWorkOrderOpen(true);
            }}
          />
        );
      case 'models':
        return <ModelsPanel onCreateAircraft={handleCreateAircraft} />;
      default:
        return <DashboardPanel />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Sidebar - hidden on mobile unless toggled */}
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
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSeedDatabase}
            disabled={seeding}
            className="text-xs"
          >
            <Database className="h-3.5 w-3.5 mr-1.5" />
            {seeding ? 'Cargando datos...' : 'Cargar Datos de Ejemplo'}
          </Button>
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
        onCreated={() => {
          // Refresh handled by panel re-renders
        }}
      />

      <CreateWorkOrderDialog
        open={createWorkOrderOpen}
        onOpenChange={setCreateWorkOrderOpen}
        preselectedRuleIds={preselectedRuleIds}
        preselectedAircraftId={selectedAircraftIdForWO || undefined}
        onCreated={() => {
          // Refresh handled by panel re-renders
        }}
      />

      <UpdateHoursDialog
        open={updateHoursOpen}
        onOpenChange={setUpdateHoursOpen}
        aircraftId={selectedAircraftIdForHours}
        currentHours={aircraftData.hours}
        currentCycles={aircraftData.cycles}
        registration={aircraftData.registration}
        onUpdated={() => {
          // Refresh handled by panel re-renders
        }}
      />
    </div>
  );
}
