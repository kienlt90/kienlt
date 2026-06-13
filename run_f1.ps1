# Script khởi chạy F1 Dashboard tự động sử dụng Node.js Portable
# Viết bởi Antigravity

$projectRoot = $PSScriptRoot
$nodePath = Join-Path $projectRoot "node-portable\node-v20.12.2-win-x64"
$dashboardPath = Join-Path $projectRoot "f1-dash\dashboard"

# 1. Thêm Node.js Portable vào PATH của phiên làm việc hiện tại
Write-Host "Configuring local environment..." -ForegroundColor Cyan
$env:PATH = "$nodePath;" + $env:PATH

# Kiểm tra xem node có chạy được không
$nodeVersion = & node -v
Write-Host "Using Node.js version: $nodeVersion" -ForegroundColor Green

# 2. Cài đặt thư viện Next.js nếu chưa có thư mục node_modules
$nodeModulesPath = Join-Path $dashboardPath "node_modules"
if (-not (Test-Path $nodeModulesPath)) {
    Write-Host "Chưa tìm thấy thư viện, tiến hành cài đặt (npm install)... Vui lòng đợi trong giây lát..." -ForegroundColor Yellow
    cd $dashboardPath
    & npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Lỗi xảy ra trong quá trình cài đặt thư viện!" -ForegroundColor Red
        Read-Host "Nhấn Enter để thoát..."
        exit 1
    }
    Write-Host "Cài đặt thư viện thành công!" -ForegroundColor Green
}

# 3. Khởi chạy server phát triển của Next.js
Write-Host "Khởi chạy F1 Dashboard trên cổng 3000..." -ForegroundColor Cyan
cd $dashboardPath
& npm run dev
