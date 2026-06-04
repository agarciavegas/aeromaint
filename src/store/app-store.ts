import { create } from 'zustand';

export type Panel = 'dashboard' | 'aircraft' | 'workorders' | 'models';

interface AppState {
  currentPanel: Panel;
  selectedAircraftId: string | null;
  selectedWorkOrderId: string | null;
  selectedRuleIds: string[];
  sidebarOpen: boolean;

  setPanel: (panel: Panel) => void;
  selectAircraft: (id: string | null) => void;
  selectWorkOrder: (id: string | null) => void;
  toggleRuleSelection: (ruleId: string) => void;
  clearRuleSelection: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPanel: 'dashboard',
  selectedAircraftId: null,
  selectedWorkOrderId: null,
  selectedRuleIds: [],
  sidebarOpen: false,

  setPanel: (panel) => set({ currentPanel: panel, selectedAircraftId: null, selectedWorkOrderId: null, selectedRuleIds: [] }),

  selectAircraft: (id) => set({ selectedAircraftId: id }),

  selectWorkOrder: (id) => set({ selectedWorkOrderId: id }),

  toggleRuleSelection: (ruleId) =>
    set((state) => {
      if (state.selectedRuleIds.includes(ruleId)) {
        return { selectedRuleIds: state.selectedRuleIds.filter((id) => id !== ruleId) };
      }
      return { selectedRuleIds: [...state.selectedRuleIds, ruleId] };
    }),

  clearRuleSelection: () => set({ selectedRuleIds: [] }),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
