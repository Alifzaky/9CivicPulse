import { create } from 'zustand';
import type { CivicReport } from '../types';

type CivicState = {
  reports: CivicReport[];
  selectedReportId: string | null;
  setReports: (reports: CivicReport[]) => void;
  selectReport: (id: string | null) => void;
};

export const useCivicStore = create<CivicState>((set) => ({
  reports: [],
  selectedReportId: null,

  // UDF: perubahan state hanya melalui action/store, bukan mutasi langsung.
  setReports: (reports) => set({ reports }),
  selectReport: (id) => set({ selectedReportId: id }),
}));
