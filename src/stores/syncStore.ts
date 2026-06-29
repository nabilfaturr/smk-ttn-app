import { create } from "zustand"

interface SyncState {
  connectionStatus: "online" | "offline" | "checking"
  pendingCount: number
  lastSync: string | null
  setConnectionStatus: (status: "online" | "offline" | "checking") => void
  setPendingCount: (count: number) => void
  setLastSync: (timestamp: string | null) => void
}

export const useSyncStore = create<SyncState>((set) => ({
  connectionStatus: "checking",
  pendingCount: 0,
  lastSync: null,
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setPendingCount: (count) => set({ pendingCount: count }),
  setLastSync: (timestamp) => set({ lastSync: timestamp }),
}))
