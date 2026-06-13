# kill-port.ps1
# Script untuk membunuh process yang menggunakan port tertentu
# Usage: .\kill-port.ps1 -Port 3099

param(
    [Parameter(Mandatory=$false)]
    [int]$Port = 3099
)

Write-Host "`n=================================================="
Write-Host "   Kill Process on Port $Port"
Write-Host "==================================================`n"

try {
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    
    if ($connection) {
        $processId = $connection.OwningProcess
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        
        Write-Host "Found process using port $Port"
        Write-Host "  PID: $processId"
        if ($process) {
            Write-Host "  Name: $($process.ProcessName)"
            Write-Host "  Path: $($process.Path)"
        }
        Write-Host ""
        
        $confirm = Read-Host "Kill this process? (Y/N)"
        
        if ($confirm -eq 'Y' -or $confirm -eq 'y') {
            Stop-Process -Id $processId -Force
            Write-Host "✅ Process $processId killed successfully" -ForegroundColor Green
            
            Start-Sleep -Seconds 1
            
            # Verify
            $stillRunning = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
            if ($stillRunning) {
                Write-Host "⚠️  Port still in use!" -ForegroundColor Yellow
            } else {
                Write-Host "✅ Port $Port is now free" -ForegroundColor Green
            }
        } else {
            Write-Host "❌ Cancelled" -ForegroundColor Red
        }
    } else {
        Write-Host "✅ Port $Port is not in use" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n==================================================`n"
