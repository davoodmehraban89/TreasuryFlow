param([Parameter(Mandatory=$true)][string]$SourceRoot)
$ErrorActionPreference='Stop'
$dir=Join-Path $env:RUNNER_TEMP 'treasuryflow-vm-evidence'
New-Item -ItemType Directory -Path $dir -Force|Out-Null
$report=[ordered]@{
  sourceVersion=$env:LAB_VERSION; portableExeFound=$false; windowsProcessStarted=$false;
  httpReady=$false; bankAdapterDisabled=$false; userInterfaceHtmlLoaded=$false;
  outcome='NOT_RUN'
}
$p=$null
try{
  $exe=@(Get-ChildItem (Join-Path $SourceRoot 'release') -Filter 'TreasuryFlow-*-Windows-x64.exe' -File |
   Where-Object {$_.Name -notlike '*Setup*'} | Sort-Object LastWriteTime -Descending)
  if($exe.Count -lt 1){throw 'PORTABLE_EXE_NOT_FOUND'}
  $report.portableExeFound=$true
  $report.launcherExited=$false
  $report.launcherExitCode=$null
  $report.actualDesktopProcessObserved=$false
  $report.exeSha256=(Get-FileHash $exe[0].FullName -Algorithm SHA256).Hash
  $env:BANK_ADAPTER_MODE='disabled'
  $env:TREASURYFLOW_DATA_FILE=Join-Path $dir 'vm-test-only.sqlite'
  $p=Start-Process -FilePath $exe[0].FullName -PassThru
  $report.windowsProcessStarted=$true
  for($i=0;$i -lt 90;$i++){
    Start-Sleep -Milliseconds 700
    # electron-builder portable is an NSIS bootstrapper. Its launcher can exit
    # after starting TreasuryFlow.exe, so launcher exit alone is not a failure.
    $p.Refresh()
    if($p.HasExited){
      $report.launcherExited=$true
      $report.launcherExitCode=$p.ExitCode
    }
    $desktopProcesses=@(Get-Process -Name 'TreasuryFlow' -ErrorAction SilentlyContinue)
    if($desktopProcesses.Count -gt 0){$report.actualDesktopProcessObserved=$true}
    try{
      $ready=Invoke-RestMethod 'http://127.0.0.1:3210/api/ready' -TimeoutSec 2
      if($ready.status -eq 'ready' -and $desktopProcesses.Count -gt 0){
        $report.httpReady=$true
        $report.bankAdapterDisabled=($ready.bankAdapter -eq 'disabled')
        break
      }
    }catch{}
  }
  if(!$report.httpReady){
    if($report.launcherExited -and !$report.actualDesktopProcessObserved){
      throw ('PORTABLE_BOOTSTRAPPER_EXITED_WITHOUT_DESKTOP_PROCESS_'+$report.launcherExitCode)
    }
    throw 'PACKAGED_HTTP_READY_TIMEOUT'
  }
  if(!$report.bankAdapterDisabled){throw 'BANK_NOT_DISABLED'}
  $html=Invoke-WebRequest 'http://127.0.0.1:3210' -TimeoutSec 15
  $report.userInterfaceHtmlLoaded=($html.StatusCode -eq 200 -and $html.Content -match 'TreasuryFlow')
  if(!$report.userInterfaceHtmlLoaded){throw 'PACKAGED_UI_HTML_FAILED'}
  $report.outcome='PACKAGED_PROCESS_AND_HTTP_PASS'
  'Real packaged Windows process + local HTTP readiness + homepage: PASS.' >> $env:GITHUB_STEP_SUMMARY
}catch{
  $report.outcome='FAIL'
  $report.reason=$_.Exception.Message
  throw
}finally{
  if($p -and !$p.HasExited){try{& taskkill.exe /T /F /PID $p.Id | Out-Null}catch{}}
  # Isolated disposable runner: remove any real app process spawned by the portable bootstrapper.
  @(Get-Process -Name 'TreasuryFlow' -ErrorAction SilentlyContinue) | ForEach-Object {try{Stop-Process -Id $_.Id -Force -ErrorAction Stop}catch{}}
  $report|ConvertTo-Json -Depth 3|Set-Content (Join-Path $dir 'runtime.json') -Encoding UTF8
}
