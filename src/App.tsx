import { HashRouter, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { LoginPage } from "./pages/auth/LoginPage"
import { DashboardPage } from "./pages/dashboard/DashboardPage"
import { StudentsPage } from "./pages/master/StudentsPage"
import { ClassesPage } from "./pages/master/ClassesPage"
import { SubjectsPage } from "./pages/master/SubjectsPage"
import { TeachersPage } from "./pages/master/TeachersPage"
import { AcademicYearsPage } from "./pages/master/AcademicYearsPage"
import { AttendanceInputPage } from "./pages/attendance/AttendanceInputPage"
import { AttendanceRecapPage } from "./pages/attendance/AttendanceRecapPage"
import { GradeInputPage } from "./pages/grades/GradeInputPage"
import { LearningObjectivesPage } from "./pages/master/LearningObjectivesPage"
// import { KetarunaanPage } from "./pages/extracurricular/KetarunaanPage" // removed: merged into ExtracurricularPage
import { ExtracurricularPage } from "./pages/extracurricular/ExtracurricularPage"
import { KokurikulerPage } from "./pages/kokurikuler/KokurikulerPage"
import { KokurikulerTingkatPage } from "./pages/kokurikuler/KokurikulerTingkatPage"
import { PrakerinPage } from "./pages/grades/PrakerinPage"
import { TeacherNotesPage } from "./pages/teacher-notes/TeacherNotesPage"
import { MapelAssignmentPage } from "./pages/master/MapelAssignmentPage"
import { GenerateReportPage } from "./pages/reports/GenerateReportPage"
import { SyncStatusPage } from "./pages/sync/SyncStatusPage"
import { SettingsPage } from "./pages/settings/SettingsPage"
import { ArsipPage } from "./pages/ArsipPage"
import { AppLayout } from "./components/layout/AppLayout"
import { ProtectedRoute, RoleRoute } from "./lib/utils/auth"

export default function App() {
  return (
    <TooltipProvider>
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />

          {/* Admin only */}
          <Route element={<RoleRoute allowedRoles={["admin"]} />}>
            <Route path="students" element={<StudentsPage />} />
            <Route path="classes" element={<ClassesPage />} />
            <Route path="subjects" element={<SubjectsPage />} />
            <Route path="teachers" element={<TeachersPage />} />
            <Route path="academic-years" element={<AcademicYearsPage />} />
            <Route path="attendance" element={<AttendanceRecapPage />} />
            <Route path="grades" element={<GradeInputPage />} />
            <Route path="ekskul" element={<ExtracurricularPage />} />
            <Route path="kokurikuler" element={<KokurikulerPage />} />
            <Route path="kokurikuler/tingkat" element={<KokurikulerTingkatPage />} />
            <Route path="prakerin" element={<PrakerinPage />} />
            <Route path="mapel-assignments" element={<MapelAssignmentPage />} />
            <Route path="arsip" element={<ArsipPage />} />
            <Route path="generate-report" element={<GenerateReportPage />} />
            <Route path="sync" element={<SyncStatusPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Shared: Admin + Wali Kelas */}
          <Route element={<RoleRoute allowedRoles={["admin", "wali_kelas"]} />}>
            <Route path="teacher-notes" element={<TeacherNotesPage />} />
          </Route>

          {/* Wali Kelas only */}
          <Route element={<RoleRoute allowedRoles={["wali_kelas"]} />}>
            <Route path="attendance/input" element={<AttendanceInputPage />} />
            <Route path="attendance/recap" element={<AttendanceRecapPage />} />
          </Route>

          {/* Guru only */}
          <Route element={<RoleRoute allowedRoles={["guru"]} />}>
            <Route path="grades/input" element={<GradeInputPage />} />
          </Route>

          {/* Admin & Guru: master data TP (admin semua mapel, guru hanya yg di-ampuh) */}
          <Route element={<RoleRoute allowedRoles={["admin", "guru"]} />}>
            <Route path="master/learning-objectives" element={<LearningObjectivesPage />} />
          </Route>
        </Route>
      </Routes>
    </HashRouter>
    <Toaster />
    </TooltipProvider>
  )
}
