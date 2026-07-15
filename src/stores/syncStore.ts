import { create } from "zustand"

export type SyncBadgeStatus =
  | "synced"
  | "syncing"
  | "pending"
  | "error"
  | "offline"
  | "unconfigured"
  | "pulling"
  | "listening"

export type StartupPullResult = {
  success: boolean
  totalUpserted: number
  error?: string
  completedAt: string
} | null

export type SyncDataChangeEvent = {
  type: "added" | "modified" | "removed"
  table: string
  id: string
  timestamp: number
}

interface SyncState {
  connectionStatus: "online" | "offline" | "checking"
  pendingCount: number
  failedCount: number
  lastSync: string | null
  firebaseConfigured: boolean
  syncing: boolean
  startupPullInProgress: boolean
  startupPullResult: StartupPullResult
  listenerStarted: boolean
  recentChanges: SyncDataChangeEvent[]
  setConnectionStatus: (status: "online" | "offline" | "checking") => void
  setPendingCount: (count: number) => void
  setFailedCount: (count: number) => void
  setLastSync: (timestamp: string | null) => void
  setFirebaseConfigured: (configured: boolean) => void
  setSyncing: (syncing: boolean) => void
  setStartupPullInProgress: (inProgress: boolean) => void
  setStartupPullResult: (result: StartupPullResult) => void
  setListenerStarted: (started: boolean) => void
  pushRecentChange: (event: SyncDataChangeEvent) => void
  clearRecentChanges: () => void
}

const MAX_RECENT_CHANGES = 20

export const useSyncStore = create<SyncState>((set) => ({
  connectionStatus: "checking",
  pendingCount: 0,
  failedCount: 0,
  lastSync: null,
  firebaseConfigured: false,
  syncing: false,
  startupPullInProgress: false,
  startupPullResult: null,
  listenerStarted: false,
  recentChanges: [],
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setPendingCount: (count) => set({ pendingCount: count }),
  setFailedCount: (count) => set({ failedCount: count }),
  setLastSync: (timestamp) => set({ lastSync: timestamp }),
  setFirebaseConfigured: (configured) => set({ firebaseConfigured: configured }),
  setSyncing: (syncing) => set({ syncing }),
  setStartupPullInProgress: (inProgress) => set({ startupPullInProgress: inProgress }),
  setStartupPullResult: (result) => set({ startupPullResult: result }),
  setListenerStarted: (started) => set({ listenerStarted: started }),
  pushRecentChange: (event) =>
    set((s) => ({
      recentChanges: [event, ...s.recentChanges].slice(0, MAX_RECENT_CHANGES),
    })),
  clearRecentChanges: () => set({ recentChanges: [] }),
}))
