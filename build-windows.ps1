# SMK TTN - Windows Build Script
# Usage: Buka PowerShell di folder project, run: .\build-windows.ps1

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot
Set-Location $ProjectRoot

# Tambahin Node.js ke PATH (kalau belum ada di session)
$nodePath = "C:\nodejs"
if (Test-Path $nodePath) {
    if ($env:PATH -notlike "*$nodePath*") {
        $env:PATH = "$nodePath;$env:PATH"
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SMK TTN - Windows Build Pipeline" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 0: Verifikasi Node.js
Write-Host "[0/5] Verifikasi Node.js..." -ForegroundColor Yellow
$nodeVer = node --version
$npmVer = npm --version
Write-Host "  Node: $nodeVer" -ForegroundColor Green
Write-Host "  npm:  $npmVer" -ForegroundColor Green
Write-Host ""

# Step 1: Setup .env (kalau belum ada)
Write-Host "[1/5] Setup .env..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "  .env dibuat dari .env.example" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: .env.example tidak ada, lanjut tanpa .env" -ForegroundColor DarkYellow
    }
} else {
    Write-Host "  .env sudah ada" -ForegroundColor Green
}
Write-Host ""

# Step 2: npm install
Write-Host "[2/5] npm install (5-10 menit, ~1.2 GB)..." -ForegroundColor Yellow
Write-Host "  Ini download semua dependencies termasuk Electron Windows binary." -ForegroundColor Gray
$sw = [System.Diagnostics.Stopwatch]::StartNew()
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  npm install GAGAL!" -ForegroundColor Red
    exit 1
}
$sw.Stop()
Write-Host "  Selesai dalam $($sw.Elapsed.Minutes)m $($sw.Elapsed.Seconds)s" -ForegroundColor Green
Write-Host ""

# Step 3: Rebuild better-sqlite3 untuk Electron ABI
Write-Host "[3/5] Rebuild better-sqlite3 untuk Electron ABI..." -ForegroundColor Yellow
Write-Host "  Penting! Tanpa step ini, .exe bakal silent crash." -ForegroundColor Gray
$sw = [System.Diagnostics.Stopwatch]::StartNew()
npx electron-rebuild -f -w better-sqlite3
if ($LASTEXITCODE -ne 0) {
    Write-Host "  electron-rebuild GAGAL!" -ForegroundColor Red
    exit 1
}
$sw.Stop()
Write-Host "  Selesai dalam $($sw.Elapsed.Minutes)m $($sw.Elapsed.Seconds)s" -ForegroundColor Green
Write-Host ""

# Step 4: Build Vite (renderer)
Write-Host "[4/5] Vite build (renderer)..." -ForegroundColor Yellow
$sw = [System.Diagnostics.Stopwatch]::StartNew()
npx vite build
if ($LASTEXITCODE -ne 0) {
    Write-Host "  vite build GAGAL!" -ForegroundColor Red
    exit 1
}
$sw.Stop()
Write-Host "  Selesai dalam $($sw.Elapsed.Minutes)m $($sw.Elapsed.Seconds)s" -ForegroundColor Green
Write-Host ""

# Step 5: Build electron-builder
Write-Host "[5/5] Build installer (5-10 menit)..." -ForegroundColor Yellow
Write-Host "  electron-builder bakal download NSIS (~100 MB) kalau belum cached." -ForegroundColor Gray
$sw = [System.Diagnostics.Stopwatch]::StartNew()
npx electron-builder --win --x64
if ($LASTEXITCODE -ne 0) {
    Write-Host "  electron-builder GAGAL!" -ForegroundColor Red
    exit 1
}
$sw.Stop()
Write-Host "  Selesai dalam $($sw.Elapsed.Minutes)m $($sw.Elapsed.Seconds)s" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "  BUILD SUCCESS!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Output installer:" -ForegroundColor Cyan
Get-ChildItem "dist\*.exe" -ErrorAction SilentlyContinue | ForEach-Object {
    $sizeMB = [math]::Round($_.Length / 1MB, 1)
    Write-Host "  $($_.Name) ($sizeMB MB)" -ForegroundColor White
}
Write-Host ""
Write-Host "Test: double-click installer di File Explorer." -ForegroundColor Yellow
Write-Host "Login default: admin / admin123" -ForegroundColor Yellow
