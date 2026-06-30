export interface ElectronAPI {
  // Auth
  login: (username: string, password: string) => Promise<{ id: number; username: string; role: string } | { error: string }>
  logout: () => Promise<void>
  changePassword: (userId: number, oldPassword: string, newPassword: string) => Promise<{ success: boolean } | { error: string }>

  // Students
  studentCreate: (data: any) => Promise<any>
  studentUpdate: (id: number, data: any) => Promise<any>
  studentDelete: (id: number) => Promise<any>
  studentGetAll: () => Promise<any[]>
  studentGetById: (id: number) => Promise<any>
  studentCheckNis: (params: { nis: string; excludeId?: number }) => Promise<
    { available: true } | { available: false; existingId: number; existingNama: string } | { error: string }
  >

  // Teachers
  teacherCreate: (data: any) => Promise<any>
  teacherUpdate: (id: number, data: any) => Promise<any>
  teacherDelete: (id: number) => Promise<any>
  teacherGetAll: () => Promise<any[]>
  teacherGetById: (id: number) => Promise<any>

  // Classes
  classCreate: (data: any) => Promise<any>
  classUpdate: (id: number, data: any) => Promise<any>
  classDelete: (id: number) => Promise<any>
  classGetAll: () => Promise<any[]>

  // Subjects
  subjectCreate: (data: any) => Promise<any>
  subjectUpdate: (id: number, data: any) => Promise<any>
  subjectDelete: (id: number) => Promise<any>
  subjectGetAll: () => Promise<any[]>

  // Academic Years
  academicYearCreate: (data: any) => Promise<any>
  academicYearUpdate: (id: number, data: any) => Promise<any>
  academicYearDelete: (id: number) => Promise<any>
  academicYearGetAll: () => Promise<any[]>

  // Attendance
  attendanceGetByClassAndDate: (kelasId: number, tanggal: string, jamPelajaran: number) => Promise<any[]>
  attendanceSave: (data: any[]) => Promise<{ success: boolean }>
  attendanceGetRecap: (kelasId: number, tanggalMulai: string, tanggalSelesai: string) => Promise<any[]>
  attendanceConvertToDays: (kelasId: number, tanggalMulai: string, tanggalSelesai: string) => Promise<any>

  // Grades
  gradeGetByMapelAndClass: (mapelId: number, kelasId: number, tahunAjaranId: number) => Promise<any[]>
  gradeSave: (data: any) => Promise<{ success: boolean }>
  gradeGetPrakerin: (siswaId: number, tahunAjaranId: number) => Promise<any>
  gradeSavePrakerin: (data: any) => Promise<{ success: boolean }>
  gradeGetKetarunaan: (tahunAjaranId: number) => Promise<any[]>
  gradeSaveKetarunaan: (data: any) => Promise<{ success: boolean }>
  gradeGetEkskul: (tahunAjaranId: number) => Promise<any[]>
  gradeSaveEkskul: (data: any) => Promise<{ success: boolean }>
  gradeGetKokurikuler: (siswaId: number, tahunAjaranId: number) => Promise<any[]>
  gradeSaveKokurikuler: (data: any) => Promise<{ success: boolean }>
  kokurikulerGetByKelas: (kelasId: number, tahunAjaranId: number) => Promise<{
    dimensi: Array<{ dimensi_id: number; nama: string; subdimensi: Array<{ id: number; nama: string; dimensi_id: number }> }>
    grades: Record<string, number>
  }>

  // TP
  tpCreate: (data: any) => Promise<any>
  tpUpdate: (id: number, data: any) => Promise<any>
  tpDelete: (id: number) => Promise<any>
  tpGetByMapel: (mapelId: number) => Promise<any[]>

  // Teacher Notes
  teacherNoteSave: (data: any) => Promise<{ success: boolean }>
  teacherNoteGetBySiswa: (siswaId: number, tahunAjaranId: number) => Promise<any>

  // Reports
  reportGenerateAkademik: (siswaId: number, kelasId: number, tahunAjaranId: number) => Promise<string>
  reportGeneratePrakerin: (siswaId: number, tahunAjaranId: number) => Promise<string>
  reportGenerateBatchAkademik: (kelasId: number, tahunAjaranId: number) => Promise<string[]>
  reportSaveToFolder: (filePaths: string[], destinationFolder: string) => Promise<{ success: boolean }>
  reportCheckCompleteness: (kelasId: number, tahunAjaranId: number) => Promise<any[]>
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
  syncExportDatabase: () => Promise<string | null>

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
