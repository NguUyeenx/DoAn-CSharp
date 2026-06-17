@echo off

start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

start "Backend" cmd /k "cd /d %~dp0backend\DoAn-CSharp && dotnet run"