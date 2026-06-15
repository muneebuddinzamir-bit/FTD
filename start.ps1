[CmdletBinding()]
param(
    [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$phpDirectory = Join-Path $root "php"
$frontendUrl = "http://127.0.0.1:5000"
$contactUrl = "http://127.0.0.1:8081"

function Stop-WithMessage {
    param([string]$Message)
    Write-Host ""
    Write-Host $Message -ForegroundColor Red
    exit 1
}

if (-not (Get-Command py -ErrorAction SilentlyContinue)) {
    Stop-WithMessage "Python launcher 'py' was not found. Install Python 3.11 or newer and try again."
}

if (-not (Get-Command php -ErrorAction SilentlyContinue)) {
    Stop-WithMessage "PHP was not found on PATH. Install PHP 8.1+ (with mbstring enabled), restart PowerShell, then run .\start.ps1 again."
}

if (-not (Get-Command composer -ErrorAction SilentlyContinue)) {
    Stop-WithMessage "Composer was not found on PATH. Install Composer, restart PowerShell, then run .\start.ps1 again."
}

if (-not (Test-Path (Join-Path $phpDirectory ".env"))) {
    Copy-Item (Join-Path $phpDirectory ".env.example") (Join-Path $phpDirectory ".env")
    Stop-WithMessage "Created php\.env. Add your Gmail address and Google app password, then run .\start.ps1 again."
}

Write-Host "Preparing Python dependencies..." -ForegroundColor Cyan
& py -m pip install -r (Join-Path $root "requirements.txt") --disable-pip-version-check
if ($LASTEXITCODE -ne 0) { Stop-WithMessage "Python dependency installation failed." }

Write-Host "Preparing PHP dependencies..." -ForegroundColor Cyan
Push-Location $phpDirectory
try {
    & composer install --no-interaction --prefer-dist
    if ($LASTEXITCODE -ne 0) { Stop-WithMessage "Composer dependency installation failed." }
}
finally {
    Pop-Location
}

$existingPorts = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
    Where-Object { $_.LocalPort -in 5000, 8081 }
if ($existingPorts) {
    $ports = ($existingPorts.LocalPort | Sort-Object -Unique) -join ", "
    Stop-WithMessage "Port(s) $ports are already in use. Stop the existing process and try again."
}

Write-Host "Starting FusionTECH..." -ForegroundColor Green
$flaskProcess = Start-Process -FilePath "py" `
    -ArgumentList @("-m", "flask", "--app", (Join-Path $root "app.py"), "run", "--host", "127.0.0.1", "--port", "5000", "--debug") `
    -WorkingDirectory $root -WindowStyle Hidden -PassThru

$phpProcess = Start-Process -FilePath "php" `
    -ArgumentList @("-S", "127.0.0.1:8081", "-t", $phpDirectory) `
    -WorkingDirectory $phpDirectory -WindowStyle Hidden -PassThru

Start-Sleep -Seconds 2
if ($flaskProcess.HasExited -or $phpProcess.HasExited) {
    if (-not $flaskProcess.HasExited) { Stop-Process -Id $flaskProcess.Id -Force }
    if (-not $phpProcess.HasExited) { Stop-Process -Id $phpProcess.Id -Force }
    Stop-WithMessage "A local server exited during startup. Check that ports 5000 and 8081 are available."
}

Write-Host ""
Write-Host "FusionTECH is running:" -ForegroundColor Green
Write-Host "  Website:     $frontendUrl"
Write-Host "  Contact API: $contactUrl/contact.php"
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers." -ForegroundColor Yellow

if (-not $NoBrowser) {
    Start-Process $frontendUrl
}

try {
    while (-not $flaskProcess.HasExited -and -not $phpProcess.HasExited) {
        Start-Sleep -Seconds 1
    }
}
finally {
    if (-not $flaskProcess.HasExited) { Stop-Process -Id $flaskProcess.Id -Force }
    if (-not $phpProcess.HasExited) { Stop-Process -Id $phpProcess.Id -Force }
}
