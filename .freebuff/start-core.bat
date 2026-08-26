@echo off
cd /d "%~dp0..\core"
set PORT=5000
npx tsx src/index.ts
