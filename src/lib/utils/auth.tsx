import { Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "../../stores/authStore"

export function ProtectedRoute({ children }: { children?: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-2 text-sm text-gray-500">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export function RoleRoute({ allowedRoles }: { allowedRoles: string[] }) {
  const { user } = useAuthStore()

  if (!user || !user.roles.some((r) => allowedRoles.includes(r))) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
