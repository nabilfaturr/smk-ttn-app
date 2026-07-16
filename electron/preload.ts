import { contextBridge, ipcRenderer } from "electron"

contextBridge.exposeInMainWorld("electronAPI", {
  // Auth
  login: (username: string, password: string) =>
    ipcRenderer.invoke("auth:login", { username, password }),
  logout: () => ipcRenderer.invoke("auth:logout"),
  changePassword: (userId: string, oldPassword: string, newPassword: string) =>
    ipcRenderer.invoke("auth:change-password", { userId, oldPassword, newPassword }),
  resetPassword: (userId: string) =>
    ipcRenderer.invoke("auth:reset-password", { userId }),

  // Users
  userGetAll: () => ipcRenderer.invoke("user:getAll"),

  // Students
  studentCreate: (data: any) => ipcRenderer.invoke("student:create", data),
  studentUpdate: (id: string, data: any) => ipcRenderer.invoke("student:update", { id, data }),
  studentDelete: (id: string) => ipcRenderer.invoke("student:delete", id),
  studentGetAll: () => ipcRenderer.invoke("student:getAll"),
  studentGetById: (id: string) => ipcRenderer.invoke("student:getById", id),
  studentCheckNis: (params: { nis: string; excludeId?: string }) =>
    ipcRenderer.invoke("student:checkNis", params),

  // Teachers
  teacherCreate: (data: any) => ipcRenderer.invoke("teacher:create", data),
  teacherUpdate: (id: string, data: any) => ipcRenderer.invoke("teacher:update", { id, data }),
  teacherDelete: (id: string) => ipcRenderer.invoke("teacher:delete", id),
  teacherGetAll: () => ipcRenderer.invoke("teacher:getAll"),
  teacherGetById: (id: string) => ipcRenderer.invoke("teacher:getById", id),

  // Classes
  classCreate: (data: any) => ipcRenderer.invoke("class:create", data),
  classUpdate: (id: string, data: any) => ipcRenderer.invoke("class:update", { id, data }),
  classDelete: (id: string) => ipcRenderer.invoke("class:delete", id),
  classGetAll: () => ipcRenderer.invoke("class:getAll"),

  // Subjects
  subjectCreate: (data: any) => ipcRenderer.invoke("subject:create", data),
  subjectUpdate: (id: string, data: any) => ipcRenderer.invoke("subject:update", { id, data }),
  subjectDelete: (id: string) => ipcRenderer.invoke("subject:delete", id),
  subjectGetAll: () => ipcRenderer.invoke("subject:getAll"),

  // Mapel Assignment (junction mapel_kelas_guru)
  mapelAssignmentGetByMapel: (mapelId: string, tahunAjaranId: string) =>
    ipcRenderer.invoke("mapelAssignment:getByMapel", { mapelId, tahunAjaranId }),
  mapelAssignmentGetByGuru: (guruId: string, tahunAjaranId: string) =>
    ipcRenderer.invoke("mapelAssignment:getByGuru", { guruId, tahunAjaranId }),
  mapelAssignmentGetByKelas: (kelasId: string, tahunAjaranId: string) =>
    ipcRenderer.invoke("mapelAssignment:getByKelas", { kelasId, tahunAjaranId }),
  mapelAssignmentUpsert: (data: {
    mapelId: string
    kelasId: string
    guruId: string
    tahunAjaranId: string
  }) => ipcRenderer.invoke("mapelAssignment:upsert", data),
  mapelAssignmentBulkUpsert: (data: {
    mapelId: string
    tahunAjaranId: string
    assignments: Array<{ kelas_id: string; guru_id: string | null }>
  }) => ipcRenderer.invoke("mapelAssignment:bulkUpsert", data),
  mapelAssignmentDelete: (id: string) =>
    ipcRenderer.invoke("mapelAssignment:delete", id),
  mapelAssignmentGetGuruList: () =>
    ipcRenderer.invoke("mapelAssignment:getGuruList"),

  // Academic Years
  academicYearCreate: (data: any) => ipcRenderer.invoke("academicYear:create", data),
  academicYearUpdate: (id: string, data: any) => ipcRenderer.invoke("academicYear:update", { id, data }),
  academicYearDelete: (id: string) => ipcRenderer.invoke("academicYear:delete", id),
  academicYearGetAll: () => ipcRenderer.invoke("academicYear:getAll"),

  // Attendance
  attendanceGetByClassAndDate: (kelasId: string, tanggal: string, jamPelajaran: number) =>
    ipcRenderer.invoke("attendance:getByClassAndDate", { kelasId, tanggal, jamPelajaran }),
  attendanceSave: (data: any[]) => ipcRenderer.invoke("attendance:save", data),
  attendanceGetRecap: (kelasId: string, tanggalMulai: string, tanggalSelesai: string) =>
    ipcRenderer.invoke("attendance:getRecap", { kelasId, tanggalMulai, tanggalSelesai }),
  attendanceConvertToDays: (kelasId: string, tanggalMulai: string, tanggalSelesai: string) =>
    ipcRenderer.invoke("attendance:convertToDays", { kelasId, tanggalMulai, tanggalSelesai }),

  // Grades
  gradeGetByMapelAndClass: (mapelId: string, kelasId: string, tahunAjaranId: string) =>
    ipcRenderer.invoke("grade:getByMapelAndClass", { mapelId, kelasId, tahunAjaranId }),
  gradeSave: (data: any) => ipcRenderer.invoke("grade:save", data),
  gradeGetPrakerin: (siswaId: string, tahunAjaranId: string) =>
    ipcRenderer.invoke("grade:getPrakerin", { siswaId, tahunAjaranId }),
  gradeSavePrakerin: (data: any) => ipcRenderer.invoke("grade:savePrakerin", data),
  gradeGetKetarunaan: (tahunAjaranId: string) =>
    ipcRenderer.invoke("grade:getKetarunaan", tahunAjaranId),
  gradeSaveKetarunaan: (data: any) => ipcRenderer.invoke("grade:saveKetarunaan", data),
  gradeGetEkskul: (tahunAjaranId: string) =>
    ipcRenderer.invoke("grade:getEkskul", tahunAjaranId),
  gradeSaveEkskul: (data: any) => ipcRenderer.invoke("grade:saveEkskul", data),
  // Ekskul enrollment (model baru: enrollment only, predikat default A)
  ekskulGetAll: () => ipcRenderer.invoke("ekskul:getAll"),
  ekskulSiswaGetByKelas: (kelasId: string, tahunAjaranId: string) =>
    ipcRenderer.invoke("ekskul-siswa:getByKelas", { kelasId, tahunAjaranId }),
  ekskulSiswaEnroll: (data: { siswaId: string; ekskulId: string; tahunAjaranId: string }) =>
    ipcRenderer.invoke("ekskul-siswa:enroll", data),
  ekskulSiswaUnenroll: (data: { siswaId: string; ekskulId: string; tahunAjaranId: string }) =>
    ipcRenderer.invoke("ekskul-siswa:unenroll", data),
  ekskulSiswaEnrollBulk: (data: { siswaIds: string[]; ekskulId: string; tahunAjaranId: string }) =>
    ipcRenderer.invoke("ekskul-siswa:enrollBulk", data),
  gradeGetKokurikuler: (siswaId: string, tahunAjaranId: string) =>
    ipcRenderer.invoke("grade:getKokurikuler", { siswaId, tahunAjaranId }),
  gradeSaveKokurikuler: (data: any) => ipcRenderer.invoke("grade:saveKokurikuler", data),
  kokurikulerGetByKelas: (kelasId: string, tahunAjaranId: string) =>
    ipcRenderer.invoke("kokurikuler:getByKelas", { kelasId, tahunAjaranId }),
  kokurikulerGetSubdimensiTingkat: () =>
    ipcRenderer.invoke("kokurikuler:getSubdimensiTingkat"),
  kokurikulerToggleSubdimensiTingkat: (subdimensiId: string, tingkat: number, active: boolean) =>
    ipcRenderer.invoke("kokurikuler:toggleSubdimensiTingkat", { subdimensiId, tingkat, active }),

  // TP (Tujuan Pembelajaran)
  tpCreate: (data: any) => ipcRenderer.invoke("tp:create", data),
  tpUpdate: (id: string, data: any) => ipcRenderer.invoke("tp:update", { id, data }),
  tpDelete: (id: string) => ipcRenderer.invoke("tp:delete", id),
  tpGetByMapel: (mapelId: string, tahunAjaranId?: number) =>
    ipcRenderer.invoke("tp:getByMapel", { mapelId, tahunAjaranId }),

  // Arsip (read-only historical TA data, admin only)
  arsipGetSummary: (tahunAjaranId: string) =>
    ipcRenderer.invoke("arsip:getSummary", tahunAjaranId),
  arsipGetSiswaList: (tahunAjaranId: string) =>
    ipcRenderer.invoke("arsip:getSiswaList", tahunAjaranId),

  // Teacher Notes
  teacherNoteSave: (data: any) => ipcRenderer.invoke("teacherNote:save", data),
  teacherNoteGetBySiswa: (siswaId: string, tahunAjaranId: string) =>
    ipcRenderer.invoke("teacherNote:getBySiswa", { siswaId, tahunAjaranId }),

  // Reports
  reportGenerateAkademik: (siswaId: string, kelasId: string, tahunAjaranId: string) =>
    ipcRenderer.invoke("report:generateAkademik", { siswaId, kelasId, tahunAjaranId }),
  reportGeneratePrakerin: (siswaId: string, tahunAjaranId: string) =>
    ipcRenderer.invoke("report:generatePrakerin", { siswaId, tahunAjaranId }),
  reportGeneratePrakerinDocx: (siswaId: string, tahunAjaranId: string) =>
    ipcRenderer.invoke("report:generatePrakerinDocx", { siswaId, tahunAjaranId }),
  reportGenerateBatchAkademik: (kelasId: string, tahunAjaranId: string) =>
    ipcRenderer.invoke("report:generateBatchAkademik", { kelasId, tahunAjaranId }),
  reportGenerateBatchPrakerinDocx: (kelasId: string, tahunAjaranId: string) =>
    ipcRenderer.invoke("report:generateBatchPrakerinDocx", { kelasId, tahunAjaranId }),
  reportSaveToFolder: (filePaths: string[], destinationFolder: string) =>
    ipcRenderer.invoke("report:saveToFolder", { filePaths, destinationFolder }),
  reportCheckCompleteness: (kelasId: string, tahunAjaranId: string) =>
    ipcRenderer.invoke("report:checkCompleteness", { kelasId, tahunAjaranId }),
  reportGetRaporDir: () => ipcRenderer.invoke("report:getRaporDir"),

  // Config
  configUpdateInfo: (data: any) => ipcRenderer.invoke("config:updateInfo", data),
  configGetInfo: () => ipcRenderer.invoke("config:getInfo"),
  configUpdateKonfigurasi: (data: any) => ipcRenderer.invoke("config:updateKonfigurasi", data),
  configGetKonfigurasi: () => ipcRenderer.invoke("config:getKonfigurasi"),

  // Sync
  syncGetStatus: () => ipcRenderer.invoke("sync:getStatus"),
  syncTriggerManualSync: () => ipcRenderer.invoke("sync:triggerManualSync"),
  syncPullFromCloud: () => ipcRenderer.invoke("sync:pullFromCloud"),
  syncGetStartupPullState: () => ipcRenderer.invoke("sync:getStartupPullState"),
  syncTriggerStartupPull: () => ipcRenderer.invoke("sync:triggerStartupPull"),
  syncGetListenerState: () => ipcRenderer.invoke("sync:getListenerState"),
  syncStartListener: () => ipcRenderer.invoke("sync:startListener"),
  syncStopListener: () => ipcRenderer.invoke("sync:stopListener"),
  syncCleanup: (options?: { retentionDays?: number; dryRun?: boolean }) =>
    ipcRenderer.invoke("sync:cleanup", options),
  syncExportDatabase: () => ipcRenderer.invoke("sync:exportDatabase"),
  // Real-time listener: subscribe ke event perubahan data dari Firestore
  onSyncDataChanged: (callback: (event: { type: string; table: string; id: string; timestamp: number }) => void) => {
    const handler = (_e: unknown, event: { type: string; table: string; id: string; timestamp: number }) => callback(event)
    ipcRenderer.on("sync:data-changed", handler)
    return () => ipcRenderer.removeListener("sync:data-changed", handler)
  },

  // Dialog
  showSaveDialog: (options: any) => ipcRenderer.invoke("dialog:showSave", options),
  showOpenDialog: (options: any) => ipcRenderer.invoke("dialog:showOpen", options),

  // Shell (open files / folders with OS default app)
  openPath: (filePath: string) => ipcRenderer.invoke("shell:openPath", filePath),
  showItemInFolder: (filePath: string) => ipcRenderer.invoke("shell:showItemInFolder", filePath),

  // Firebase config (encrypted di userData via safeStorage)
  firebaseConfigSave: (config: any) => ipcRenderer.invoke("firebaseConfig:save", config),
  firebaseConfigGet: () => ipcRenderer.invoke("firebaseConfig:get"),
  firebaseConfigDelete: () => ipcRenderer.invoke("firebaseConfig:delete"),
  firebaseConfigTest: (config: any) => ipcRenderer.invoke("firebaseConfig:test", config),
})
