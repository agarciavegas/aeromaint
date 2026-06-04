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
import { Menu, Database, Download, Upload, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isSeeded, seedDatabase, exportData, importData, resetDatabase, getAircraft } from '@/lib/local-db';

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
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUpdateHours = useCallback((aircraftId: string) => {
    const ac = getAircraft(aircraftId);
    if (ac) {
      setSelectedAircraftIdForHours(aircraftId);
      setAircraftData({
        hours: ac.totalHours,
        cycles: ac.totalCycles,
        registration: ac.registration,
      });
      setUpdateHoursOpen(true);
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

  const handleSeedDatabase = useCallback(() => {
    setSeeding(true);
    try {
      seedDatabase();
      setRefreshKey(k => k + 1);
    } finally {
      setSeeding(false);
    }
  }, []);

  const handleResetDatabase = useCallback(() => {
    if (confirm('¿Estás seguro? Se borrarán todos los datos.')) {
      resetDatabase();
      setRefreshKey(k => k + 1);
    }
  }, []);

  const handleExport = useCallback(() => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aeromaint-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const text = ev.target?.result as string;
          if (importData(text)) {
            setRefreshKey(k => k + 1);
          } else {
            alert('Error al importar los datos. Formato no válido.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
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
          />
        );
      case 'models':
        return <ModelsPanel key={`models-${refreshKey}`} onCreateAircraft={handleCreateAircraft} />;
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
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="text-xs">
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Exportar
            </Button>
            <Button variant="outline" size="sm" onClick={handleImport} className="text-xs">
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Importar
            </Button>
            {!isSeeded() && (
              <Button variant="outline" size="sm" onClick={handleSeedDatabase} disabled={seeding} className="text-xs">
                <Database className="h-3.5 w-3.5 mr-1.5" />
                {seeding ? 'Cargando...' : 'Cargar Datos'}
              </Button>
            )}
            {isSeeded() && (
              <Button variant="ghost" size="sm" onClick={handleResetDatabase} className="text-xs text-red-500">
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Reset
              </Button>
            )}
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
