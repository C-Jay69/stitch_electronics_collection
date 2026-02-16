Write-Host "Starting Hostinger Build Process..." -ForegroundColor Green

# 1. Clean previous build
Write-Host "Cleaning previous build..."
if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }
if (Test-Path "stitch_electronics_dist") { Remove-Item -Recurse -Force "stitch_electronics_dist" }
if (Test-Path "stitch_electronics_dist.zip") { Remove-Item -Force "stitch_electronics_dist.zip" }

# 2. Build Next.js app
Write-Host "Building Next.js application (Standalone Mode)..."
$env:NODE_ENV = "production"
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

# 3. Prepare Distribution Folder
Write-Host "Preparing distribution folder..."
New-Item -ItemType Directory -Force -Path "stitch_electronics_dist" | Out-Null

# Copy Standalone build
Copy-Item -Recurse -Force ".next/standalone/*" "stitch_electronics_dist/"

# Copy Static Assets (.next/static -> .next/standalone/.next/static)
# Next.js standalone doesn't include static files by default, they must be copied.
New-Item -ItemType Directory -Force -Path "stitch_electronics_dist/.next/static" | Out-Null
Copy-Item -Recurse -Force ".next/static/*" "stitch_electronics_dist/.next/static/"

# Copy Public Assets (public -> .next/standalone/public)
New-Item -ItemType Directory -Force -Path "stitch_electronics_dist/public" | Out-Null
Copy-Item -Recurse -Force "public/*" "stitch_electronics_dist/public/"

# 4. Create ZIP for upload
Write-Host "Zipping distribution folder..."
Compress-Archive -Path "stitch_electronics_dist/*" -DestinationPath "stitch_electronics_dist.zip"

Write-Host "Build Complete!" -ForegroundColor Green
Write-Host "1. Upload 'stitch_electronics_dist.zip' to your Hostinger File Manager (public_html or subdirectory)."
Write-Host "2. Extract the zip."
Write-Host "3. Setup Node.js in Hostinger hPanel."
Write-Host "4. Point root to the extracted folder."
Write-Host "5. Run 'node server.js' (or configure startup command)."
