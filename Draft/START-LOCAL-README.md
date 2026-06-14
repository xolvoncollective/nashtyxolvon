# Start-Local.ps1 Documentation

## Overview

The `start-local.ps1` PowerShell script provides a reliable, one-command local development environment for NASHTY OS. It replaces the problematic `start-local.bat` with comprehensive error handling and validation at each step.

## Quick Start

```powershell
powershell -ExecutionPolicy Bypass -File .\start-local.ps1
```

Run this command from the project root directory.

## What the Script Does

The script performs 9 sequential steps with error handling:

### 1. Node.js Version Check
- Verifies Node.js v18+ is installed
- Shows clear error with download link if missing

### 2. Port Conflict Resolution
- Checks if port 3099 is in use
- Automatically kills existing process
- Waits 2 seconds and verifies port is freed

### 3. Backend Directory Navigation
- Validates `backoffice/backend` exists
- Shows expected path if missing

### 4. Dependency Installation
- Checks if `node_modules` exists
- Runs `npm install` only if needed
- Displays npm errors on failure

### 5. TypeScript Compilation
- Runs `npm run build`
- Shows TypeScript errors on failure
- Halts execution if build fails

### 6. Database Initialization
- Checks if `data/nashtypos.db` exists
- Runs `npm run db:seed` only if database missing
- Shows seed errors on failure

### 7. Server Startup
- Sets `PORT=3099` environment variable
- Starts `npm run dev` as background job
- Provides job ID for monitoring

### 8. Health Check Polling
- Polls `http://localhost:3099/health`
- Retries up to 15 times with 1-second delays
- Shows clear error if health check times out

### 9. Browser Launch
- Opens default browser to `http://localhost:3099/`
- Only executes after health check passes

## Success Output

When successful, you'll see:

```
==================================================
   ✅ SUCCESS: Server running on port 3099
==================================================

Access Points:
  • Main Login:   http://localhost:3099/
  • POS:          http://localhost:3099/pos/frontend/
  • KDS:          http://localhost:3099/kds/frontend/
  • Backoffice:   http://localhost:3099/backoffice/

Server is running in background (Job ID: X)
To view server logs: Receive-Job -Id X -Keep
To stop server: Stop-Job -Id X; Remove-Job -Id X
```

## Error Scenarios and Solutions

### Error: Node.js not installed
**Message:** `ERROR: Node.js not installed. Please install Node.js v18 or higher.`

**Solution:** Download and install Node.js from https://nodejs.org/

### Error: Backend directory not found
**Message:** `ERROR: backend directory not found. Please run from project root.`

**Solution:** Navigate to the project root directory (where start-local.ps1 is located)

### Error: Dependency installation failed
**Message:** `ERROR: Dependency installation failed!` + npm output

**Solution:** 
- Check your internet connection
- Try running `npm install --verbose` manually in `backoffice/backend`
- Delete `node_modules` and `package-lock.json`, then retry

### Error: TypeScript compilation failed
**Message:** `ERROR: TypeScript compilation failed!` + build output

**Solution:**
- Review the TypeScript errors shown
- Fix the errors in the source files
- Re-run the script

### Error: Database seeding failed
**Message:** `ERROR: Database seeding failed!` + seed output

**Solution:**
- Delete `data/nashtypos.db` if it exists
- Re-run the script
- Check `backoffice/backend/src/db/seed.ts` for issues

### Error: Port could not be freed
**Message:** `ERROR: Port 3099 could not be freed. Please manually kill PID X`

**Solution:**
```powershell
Stop-Process -Id X -Force
```

### Error: Health check failed
**Message:** `ERROR: Server started but health check failed after 15 attempts.`

**Solution:**
- Wait a few more seconds and access `http://localhost:3099/health` manually
- Check server logs: `Receive-Job -Id X` (replace X with Job ID shown)
- Check if another service is using port 3099
- Review `backoffice/backend/src/index.ts` for startup issues

## Monitoring the Server

After the script starts the server successfully, it displays live output. You can:

- **View logs:** The script shows live server output automatically
- **Stop monitoring:** Press `Ctrl+C` (server continues running)
- **View logs later:** `Receive-Job -Id X -Keep` (replace X with Job ID)
- **Stop server:** `Stop-Job -Id X; Remove-Job -Id X`

## Testing Error Scenarios

To validate the error handling works correctly:

1. **No Node.js:** Temporarily rename `node.exe` in PATH
2. **Port conflict:** Run the script twice simultaneously
3. **Missing directory:** Run from a different directory
4. **Build failure:** Add a syntax error to `src/index.ts`
5. **Missing database:** Delete `data/nashtypos.db`
6. **Health check timeout:** Kill server process after step 7

## Comparison with start-local.bat

| Feature | start-local.bat | start-local.ps1 |
|---------|----------------|-----------------|
| Node.js version check | ❌ No | ✅ Yes (v18+) |
| Port verification | ⚠️ Unreliable | ✅ Reliable |
| Dependency check | ❌ Always installs | ✅ Conditional |
| Build error handling | ❌ No | ✅ Yes |
| Database check | ⚠️ Runs seed always | ✅ Only if missing |
| Health check | ❌ No | ✅ Yes (15 attempts) |
| Error messages | ⚠️ Generic | ✅ Specific & actionable |
| Background server | ❌ Blocks terminal | ✅ Background job |

## Requirements Validated

This script implements:

- **Requirement 1:** Reliable Local Development Environment (all 10 acceptance criteria)
- **Requirement 20:** Script Error Recovery and User Guidance (all 7 acceptance criteria)
- **Requirement 11.7:** Startup script shall poll health endpoint before opening browser

## Troubleshooting

### Script won't run - execution policy error

```powershell
powershell -ExecutionPolicy Bypass -File .\start-local.ps1
```

### Server starts but browser doesn't open

Manually navigate to: `http://localhost:3099/`

### Can't find server logs

```powershell
# List all background jobs
Get-Job

# View specific job output
Receive-Job -Id X -Keep
```

### Script hangs at health check

- The server may be slow to start (especially first time)
- Check if antivirus is blocking the server
- Verify no firewall rules blocking localhost:3099

## Future Enhancements

Possible improvements for v3.0.0:
- [ ] Add `--clean` flag to force reinstall dependencies
- [ ] Add `--skip-build` flag for faster restarts
- [ ] Add `--port` parameter for custom port
- [ ] Colored log output parsing
- [ ] Automatic log file creation
- [ ] Integration with Windows Service for production
