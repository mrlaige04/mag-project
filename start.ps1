$ErrorActionPreference = "Stop"

Write-Host "Starting base services (postgres, redis, rabbitmq, nginx, minio)..." -ForegroundColor Green
docker compose up -d --build

Write-Host "Starting auth-service..." -ForegroundColor Green
Set-Location src/auth-service
docker compose up -d --build
Set-Location ../..

Write-Host "Starting card-service..." -ForegroundColor Green
Set-Location src/card-service
docker compose up -d --build
Set-Location ../..

Write-Host "Starting history-service..." -ForegroundColor Green
Set-Location src/history-service
docker compose up -d --build
Set-Location ../..

Write-Host "Starting payment-service..." -ForegroundColor Green
Set-Location src/payment-service
docker compose up -d --build
Set-Location ../..

Write-Host "Starting user-service..." -ForegroundColor Green
Set-Location src/user-service
docker compose up -d --build
Set-Location ../..

Write-Host "Starting verification-service..." -ForegroundColor Green
Set-Location src/verification-service
docker compose up -d --build
Set-Location ../..

Write-Host "All services started successfully!" -ForegroundColor Green

