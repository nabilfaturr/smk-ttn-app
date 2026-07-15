export interface ElectronAPI {
  // Auth
  login: (username: string, password: string) => Promise<{ id: string; username: string; role: string } | { error: string }>
  logout: () => Promise<void>
  changePassword: (userId: string, oldPassword: string, newPassword: string) => Promise<{ success: boolean } | { error: string }>

  // Students
  studentCreate: (data: any) => Promise<any>
  studentUpdate: (id: string, data: any) => Promise<any>
  studentDelete: (id: string) => Promise<any>
  studentGetAll: () => Promise<any[]>
  studentGetById: (id: string) => Promise<any>
  studentCheckNis: (params: { nis: string; excludeId?: string }) => Promise<
    { available: true } | { available: false; existingId: string; existingNama: string } | { error: string }
  >

  // Teachers
  teacherCreate: (data: any) => Promise<any>
  teacherUpdate: (id: string, data: any) => Promise<any>
  teacherDelete: (id: string) => Promise<any>
  teacherGetAll: () => Promise<any[]>
  teacherGetById: (id: string) => Promise<any>

  // Classes
  classCreate: (data: any) => Promise<any>
  classUpdate: (id: string, data: any) => Promise<any>
  classDelete: (id: string) => Promise<any>
  classGetAll: () => Promise<any[]>

  // Subjects
  subjectCreate: (data: any) => Promise<any>
  subjectUpdate: (id: string, data: any) => Promise<any>
  subjectDelete: (id: string) => Promise<any>
  subjectGetAll: () => Promise<any[]>

  // Academic Years
  academicYearCreate: (data: any) => Promise<any>
  academicYearUpdate: (id: string, data: any) => Promise<any>
  academicYearDelete: (id: string) => Promise<any>
  academicYearGetAll: () => Promise<any[]>

  // Attendance
  attendanceGetByClassAndDate: (kelasId: string, tanggal: string, jamPelajaran: number) => Promise<any[]>
  attendanceSave: (data: any[]) => Promise<{ success: boolean }>
  attendanceGetRecap: (kelasId: string, tanggalMulai: string, tanggalSelesai: string) => Promise<any[]>
  attendanceConvertToDays: (kelasId: string, tanggalMulai: string, tanggalSelesai: string) => Promise<any>

  // Grades
  gradeGetByMapelAndClass: (mapelId: string, kelasId: string, tahunAjaranId: string) => Promise<any[]>
  gradeSave: (data: any) => Promise<{ success: boolean }>
  gradeGetPrakerin: (siswaId: string, tahunAjaranId: string) => Promise<any>
  gradeSavePrakerin: (data: any) => Promise<{ success: boolean }>
  gradeGetKetarunaan: (tahunAjaranId: string) => Promise<any[]>
  gradeSaveKetarunaan: (data: any) => Promise<{ success: boolean }>
  gradeGetEkskul: (tahunAjaranId: string) => Promise<any[]>
  gradeSaveEkskul: (data: any) => Promise<{ success: boolean }>
  gradeGetKokurikuler: (siswaId: string, tahunAjaranId: string) => Promise<any[]>
  gradeSaveKokurikuler: (data: any) => Promise<{ success: boolean }>
  kokurikulerGetByKelas: (kelasId: string, tahunAjaranId: string) => Promise<{
    dimensi: Array<{ dimensi_id: string; nama: string; subdimensi: Array<{ id: string; nama: string; dimensi_id: string }> }>
    grades: Record<string, number>
  }>

  // TP
  tpCreate: (data: any) => Promise<any>
  tpUpdate: (id: string, data: any) => Promise<any>
  tpDelete: (id: string) => Promise<any>
  tpGetByMapel: (mapelId: string) => Promise<any[]>

  // Teacher Notes
  teacherNoteSave: (data: any) => Promise<{ success: boolean }>
  teacherNoteGetBySiswa: (siswaId: string, tahunAjaranId: string) => Promise<any>

  // Reports
  reportGenerateAkademik: (siswaId: string, kelasId: string, tahunAjaranId: string) => Promise<string>
  reportGeneratePrakerin: (siswaId: string, tahunAjaranId: string) => Promise<string>
  reportGenerateBatchAkademik: (kelasId: string, tahunAjaranId: string) => Promise<string[]>
  reportSaveToFolder: (filePaths: string[], destinationFolder: string) => Promise<{ success: boolean }>
  reportCheckCompleteness: (kelasId: string, tahunAjaranId: string) => Promise<any[]>
  reportGetRaporDir: () => Promise<string>

  // Config
  configUpdateInfo: (data: any) => Promise<{ success: boolean }>
  configGetInfo: () => Promise<any>
  configUpdateKonfigurasi: (data: any) => Promise<{ success: boolean }>
  configGetKonfigurasi: () => Promise<any[]>

  // Sync
  syncGetStatus: () => Promise<any>
  syncTriggerManualSync: () => Promise<{ success: boolean }>
  syncPullFromCloud: () => Promise<{ success: boolean; totalFetched: number; totalUpserted: number; tables: Array<{ name: string; fetched: number; upserted: number; error?: string }>; error?: string }>
  syncGetStartupPullState: () => Promise<{ inProgress: boolean; result: { success: boolean; totalUpserted: number; error?: string; completedAt: string } | null }>
  syncTriggerStartupPull: () => Promise<{ success: boolean; totalFetched: number; totalUpserted: number; tables: Array<{ name: string; fetched: number; upserted: number; error?: string }>; error?: string }>
  syncGetListenerState: () => Promise<{ started: boolean; stats: { started: boolean; subscriptions: number; listeners: number } }>
  syncStartListener: () => Promise<{ success: boolean; error?: string }>
  syncStopListener: () => Promise<{ success: boolean }>
  syncExportDatabase: () => Promise<string | null>
  onSyncDataChanged: (callback: (event: { type: string; table: string; id: string; timestamp: number }) => void) => () => void

  // Dialog
  showSaveDialog: (options: any) => Promise<any>
  showOpenDialog: (options: any) => Promise<any>

  // Shell (open files / folders with OS default app)
  openPath: (filePath: string) => Promise<{ success?: boolean; error?: string }>
  showItemInFolder: (filePath: string) => Promise<{ success?: boolean; error?: string }>

  // Firebase config (encrypted di userData)
  firebaseConfigSave: (config: FirebaseConfigInput) => Promise<{ success: boolean; encrypted?: boolean; error?: string }>
  firebaseConfigGet: () => Promise<(FirebaseConfig & { apiKey: string }) | null>
  firebaseConfigDelete: () => Promise<{ success: boolean; error?: string }>
  firebaseConfigTest: (config: FirebaseConfigInput) => Promise<{ success: boolean; message: string }>
}

export type FirebaseConfigInput = {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

export type FirebaseConfig = FirebaseConfigInput
