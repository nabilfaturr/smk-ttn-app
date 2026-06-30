import { create } from "zustand"

export type SyncBadgeStatus =
  | "synced"
  | "syncing"
  | "pending"
  | "error"
  | "offline"
  | "unconfigured"

interface SyncState {
  connectionStatus: "online" | "offline" | "checking"
  pendingCount: number
  failedCount: number
  lastSync: string | null
  firebaseConfigured: boolean
  syncing: boolean
  setConnectionStatus: (status: "online" | "offline" | "checking") => void
  setPendingCount: (count: number) => void
  setFailedCount: (count: number) => void
  setLastSync: (timestamp: string | null) => void
  setFirebaseConfigured: (configured: boolean) => void
  setSyncing: (syncing: boolean) => void
}

export const useSyncStore = create<SyncState>((set) => ({
  connectionStatus: "checking",
  pendingCount: 0,
  failedCount: 0,
  lastSync: null,
  firebaseConfigured: false,
  syncing: false,
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setPendingCount: (count) => set({ pendingCount: count }),
  setFailedCount: (count) => set({ failedCount: count }),
  setLastSync: (timestamp) => set({ lastSync: timestamp }),
  setFirebaseConfigured: (configured) => set({ firebaseConfigured: configured }),
  setSyncing: (syncing) => set({ syncing }),
}))
