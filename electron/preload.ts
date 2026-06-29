import { contextBridge, ipcRenderer } from "electron"

contextBridge.exposeInMainWorld("electronAPI", {
  // Auth
  login: (username: string, password: string) =>
    ipcRenderer.invoke("auth:login", { username, password }),
  logout: () => ipcRenderer.invoke("auth:logout"),
  changePassword: (userId: number, oldPassword: string, newPassword: string) =>
    ipcRenderer.invoke("auth:change-password", { userId, oldPassword, newPassword }),
  resetPassword: (userId: number) =>
    ipcRenderer.invoke("auth:reset-password", { userId }),

  // Users
  userGetAll: () => ipcRenderer.invoke("user:getAll"),

  // Students
  studentCreate: (data: any) => ipcRenderer.invoke("student:create", data),
  studentUpdate: (id: number, data: any) => ipcRenderer.invoke("student:update", { id, data }),
  studentDelete: (id: number) => ipcRenderer.invoke("student:delete", id),
  studentGetAll: () => ipcRenderer.invoke("student:getAll"),
  studentGetById: (id: number) => ipcRenderer.invoke("student:getById", id),
  studentCheckNis: (params: { nis: string; excludeId?: number }) =>
    ipcRenderer.invoke("student:checkNis", params),

  // Teachers
  teacherCreate: (data: any) => ipcRenderer.invoke("teacher:create", data),
  teacherUpdate: (id: number, data: any) => ipcRenderer.invoke("teacher:update", { id, data }),
  teacherDelete: (id: number) => ipcRenderer.invoke("teacher:delete", id),
  teacherGetAll: () => ipcRenderer.invoke("teacher:getAll"),
  teacherGetById: (id: number) => ipcRenderer.invoke("teacher:getById", id),

  // Classes
  classCreate: (data: any) => ipcRenderer.invoke("class:create", data),
  classUpdate: (id: number, data: any) => ipcRenderer.invoke("class:update", { id, data }),
  classDelete: (id: number) => ipcRenderer.invoke("class:delete", id),
  classGetAll: () => ipcRenderer.invoke("class:getAll"),

  // Subjects
  subjectCreate: (data: any) => ipcRenderer.invoke("subject:create", data),
  subjectUpdate: (id: number, data: any) => ipcRenderer.invoke("subject:update", { id, data }),
  subjectDelete: (id: number) => ipcRenderer.invoke("subject:delete", id),
  subjectGetAll: () => ipcRenderer.invoke("subject:getAll"),

  // Mapel Assignment (junction mapel_kelas_guru)
  mapelAssignmentGetByMapel: (mapelId: number, tahunAjaranId: number) =>
    ipcRenderer.invoke("mapelAssignment:getByMapel", { mapelId, tahunAjaranId }),
  mapelAssignmentGetByGuru: (guruId: number, tahunAjaranId: number) =>
    ipcRenderer.invoke("mapelAssignment:getByGuru", { guruId, tahunAjaranId }),
  mapelAssignmentGetByKelas: (kelasId: number, tahunAjaranId: number) =>
    ipcRenderer.invoke("mapelAssignment:getByKelas", { kelasId, tahunAjaranId }),
  mapelAssignmentUpsert: (data: {
    mapelId: number
    kelasId: number
    guruId: number
    tahunAjaranId: number
  }) => ipcRenderer.invoke("mapelAssignment:upsert", data),
  mapelAssignmentBulkUpsert: (data: {
    mapelId: number
    tahunAjaranId: number
    assignments: Array<{ kelas_id: number; guru_id: number | null }>
  }) => ipcRenderer.invoke("mapelAssignment:bulkUpsert", data),
  mapelAssignmentDelete: (id: number) =>
    ipcRenderer.invoke("mapelAssignment:delete", id),
  mapelAssignmentGetGuruList: () =>
    ipcRenderer.invoke("mapelAssignment:getGuruList"),

  // Academic Years
  academicYearCreate: (data: any) => ipcRenderer.invoke("academicYear:create", data),
  academicYearUpdate: (id: number, data: any) => ipcRenderer.invoke("academicYear:update", { id, data }),
  academicYearDelete: (id: number) => ipcRenderer.invoke("academicYear:delete", id),
  academicYearGetAll: () => ipcRenderer.invoke("academicYear:getAll"),

  // Attendance
  attendanceGetByClassAndDate: (kelasId: number, tanggal: string, jamPelajaran: number) =>
    ipcRenderer.invoke("attendance:getByClassAndDate", { kelasId, tanggal, jamPelajaran }),
  attendanceSave: (data: any[]) => ipcRenderer.invoke("attendance:save", data),
  attendanceGetRecap: (kelasId: number, tanggalMulai: string, tanggalSelesai: string) =>
    ipcRenderer.invoke("attendance:getRecap", { kelasId, tanggalMulai, tanggalSelesai }),
  attendanceConvertToDays: (kelasId: number, tanggalMulai: string, tanggalSelesai: string) =>
    ipcRenderer.invoke("attendance:convertToDays", { kelasId, tanggalMulai, tanggalSelesai }),

  // Grades
  gradeGetByMapelAndClass: (mapelId: number, kelasId: number, tahunAjaranId: number) =>
    ipcRenderer.invoke("grade:getByMapelAndClass", { mapelId, kelasId, tahunAjaranId }),
  gradeSave: (data: any) => ipcRenderer.invoke("grade:save", data),
  gradeGetPrakerin: (siswaId: number, tahunAjaranId: number) =>
    ipcRenderer.invoke("grade:getPrakerin", { siswaId, tahunAjaranId }),
  gradeSavePrakerin: (data: any) => ipcRenderer.invoke("grade:savePrakerin", data),
  gradeGetKetarunaan: (tahunAjaranId: number) =>
    ipcRenderer.invoke("grade:getKetarunaan", tahunAjaranId),
  gradeSaveKetarunaan: (data: any) => ipcRenderer.invoke("grade:saveKetarunaan", data),
  gradeGetEkskul: (tahunAjaranId: number) =>
    ipcRenderer.invoke("grade:getEkskul", tahunAjaranId),
  gradeSaveEkskul: (data: any) => ipcRenderer.invoke("grade:saveEkskul", data),
  // Ekskul enrollment (model baru: enrollment only, predikat default A)
  ekskulGetAll: () => ipcRenderer.invoke("ekskul:getAll"),
  ekskulSiswaGetByKelas: (kelasId: number, tahunAjaranId: number) =>
    ipcRenderer.invoke("ekskul-siswa:getByKelas", { kelasId, tahunAjaranId }),
  ekskulSiswaEnroll: (data: { siswaId: number; ekskulId: number; tahunAjaranId: number }) =>
    ipcRenderer.invoke("ekskul-siswa:enroll", data),
  ekskulSiswaUnenroll: (data: { siswaId: number; ekskulId: number; tahunAjaranId: number }) =>
    ipcRenderer.invoke("ekskul-siswa:unenroll", data),
  ekskulSiswaEnrollBulk: (data: { siswaIds: number[]; ekskulId: number; tahunAjaranId: number }) =>
    ipcRenderer.invoke("ekskul-siswa:enrollBulk", data),
  gradeGetKokurikuler: (siswaId: number, tahunAjaranId: number) =>
    ipcRenderer.invoke("grade:getKokurikuler", { siswaId, tahunAjaranId }),
  gradeSaveKokurikuler: (data: any) => ipcRenderer.invoke("grade:saveKokurikuler", data),
  kokurikulerGetByKelas: (kelasId: number, tahunAjaranId: number) =>
    ipcRenderer.invoke("kokurikuler:getByKelas", { kelasId, tahunAjaranId }),
  kokurikulerGetSubdimensiTingkat: () =>
    ipcRenderer.invoke("kokurikuler:getSubdimensiTingkat"),
  kokurikulerToggleSubdimensiTingkat: (subdimensiId: number, tingkat: number, active: boolean) =>
    ipcRenderer.invoke("kokurikuler:toggleSubdimensiTingkat", { subdimensiId, tingkat, active }),

  // TP (Tujuan Pembelajaran)
  tpCreate: (data: any) => ipcRenderer.invoke("tp:create", data),
  tpUpdate: (id: number, data: any) => ipcRenderer.invoke("tp:update", { id, data }),
  tpDelete: (id: number) => ipcRenderer.invoke("tp:delete", id),
  tpGetByMapel: (mapelId: number, tahunAjaranId?: number) =>
    ipcRenderer.invoke("tp:getByMapel", { mapelId, tahunAjaranId }),

  // Arsip (read-only historical TA data, admin only)
  arsipGetSummary: (tahunAjaranId: number) =>
    ipcRenderer.invoke("arsip:getSummary", tahunAjaranId),
  arsipGetSiswaList: (tahunAjaranId: number) =>
    ipcRenderer.invoke("arsip:getSiswaList", tahunAjaranId),

  // Teacher Notes
  teacherNoteSave: (data: any) => ipcRenderer.invoke("teacherNote:save", data),
  teacherNoteGetBySiswa: (siswaId: number, tahunAjaranId: number) =>
    ipcRenderer.invoke("teacherNote:getBySiswa", { siswaId, tahunAjaranId }),

  // Reports
  reportGenerateAkademik: (siswaId: number, kelasId: number, tahunAjaranId: number) =>
    ipcRenderer.invoke("report:generateAkademik", { siswaId, kelasId, tahunAjaranId }),
  reportGeneratePrakerin: (siswaId: number, tahunAjaranId: number) =>
    ipcRenderer.invoke("report:generatePrakerin", { siswaId, tahunAjaranId }),
  reportGenerateBatchAkademik: (kelasId: number, tahunAjaranId: number) =>
    ipcRenderer.invoke("report:generateBatchAkademik", { kelasId, tahunAjaranId }),
  reportSaveToFolder: (filePaths: string[], destinationFolder: string) =>
    ipcRenderer.invoke("report:saveToFolder", { filePaths, destinationFolder }),
  reportCheckCompleteness: (kelasId: number, tahunAjaranId: number) =>
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
  syncExportDatabase: () => ipcRenderer.invoke("sync:exportDatabase"),

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
