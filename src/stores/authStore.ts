import { create } from "zustand"

export interface User {
  id: number
  username: string
  nama?: string
  kode_login?: string
  role: string
  roles: string[]
  guru_id?: number
  kelas_id?: number
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (username, password) => {
    set({ isLoading: true })
    try {
      const result = await window.electronAPI.login(username, password)
      if ("error" in result) {
        set({ isLoading: false })
        return { success: false, error: result.error }
      }
      const userData = result as any
      const user: User = {
        id: userData.id,
        username: userData.username,
        nama: userData.nama,
        kode_login: userData.kode_login,
        role: userData.role,
        roles: userData.roles || userData.role.split(","),
        guru_id: userData.guru_id,
        kelas_id: userData.kelas_id,
      }
      set({ user, isAuthenticated: true, isLoading: false })
      return { success: true }
    } catch {
      set({ isLoading: false })
      return { success: false, error: "Terjadi kesalahan koneksi" }
    }
  },

  logout: () => {
    window.electronAPI.logout()
    set({ user: null, isAuthenticated: false })
  },

  setUser: (user) => set({ user, isAuthenticated: true }),
}))
