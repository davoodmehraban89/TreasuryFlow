param([Parameter(Mandatory=$true)][string]$SourceRoot)
$ErrorActionPreference='Stop'
$evidenceDir=Join-Path $env:RUNNER_TEMP 'treasuryflow-vm-evidence'
New-Item -ItemType Directory -Path $evidenceDir -Force | Out-Null
$exe=Join-Path $SourceRoot 'release/win-unpacked/TreasuryFlow.exe'
$stdout=Join-Path $env:RUNNER_TEMP 'treasuryflow-unpacked-stdout.txt'
$stderr=Join-Path $env:RUNNER_TEMP 'treasuryflow-unpacked-stderr.txt'
$report=[ordered]@{
 mode='DIRECT_UNPACKED_ELECTRON_EXE'
 executablePresent=$false
 launched=$false
 exited=$false
 exitCode=$null
 httpReady=$false
 bankAdapterDisabled=$false
 loginHtmlLoaded=$false
 stdoutBytes=0
 stderrBytes=0
 stderrMarkers=@()
 stderrExcerpt=''
 stdoutExcerpt=''
 inheritedElectronRunAsNode=($env:ELECTRON_RUN_AS_NODE -eq '1')
 outcome='NOT_RUN'
}
$p=$null
try {
 if(!(Test-Path $exe)){throw 'UNPACKED_ELECTRON_EXE_MISSING'}
 $report.executablePresent=$true
 $env:BANK_ADAPTER_MODE='disabled'
 $env:TREASURYFLOW_DESKTOP_LOCAL='1'
 $env:TREASURYFLOW_VM_DIAGNOSTICS='1'
 $env:TREASURYFLOW_DATA_FILE=Join-Path $evidenceDir 'unpacked-synthetic.sqlite'
 $p=Start-Process -FilePath $exe -WorkingDirectory (Split-Path $exe) -PassThru -RedirectStandardOutput $stdout -RedirectStandardError $stderr
 $report.launched=$true
 $stopAt=[DateTime]::UtcNow.AddSeconds(90)
 while([DateTime]::UtcNow -lt $stopAt){
  Start-Sleep -Milliseconds 700
  $p.Refresh()
  if($p.HasExited){
   $report.exited=$true
   $report.exitCode=$p.ExitCode
   throw ('UNPACKED_ELECTRON_PROCESS_EXITED_'+$p.ExitCode)
  }
  try {
   $ready=Invoke-RestMethod 'http://127.0.0.1:3210/api/ready' -TimeoutSec 2
   if($ready.status -eq 'ready' -and $ready.bankAdapter -eq 'disabled'){
    $report.httpReady=$true
    $report.bankAdapterDisabled=$true
    break
   }
  }catch{}
 }
 if(!$report.httpReady){throw 'UNPACKED_ELECTRON_READINESS_TIMEOUT'}
 $login=Invoke-WebRequest 'http://127.0.0.1:3210/login' -TimeoutSec 10
 $report.loginHtmlLoaded=($login.StatusCode -eq 200 -and $login.Content -match 'TreasuryFlow')
 if(!$report.loginHtmlLoaded){throw 'UNPACKED_ELECTRON_LOCAL_LOGIN_FAILED'}
 $report.outcome='UNPACKED_ELECTRON_HTTP_AND_PROCESS_PASS'
 'Direct win-unpacked TreasuryFlow.exe launched and passed local-bank-disabled HTTP checks.' >> $env:GITHUB_STEP_SUMMARY
}catch{
 $report.outcome='FAILED'
 $report.failureCode=$_.Exception.Message
 throw
}finally{
 if($p -and !$p.HasExited){try{& taskkill.exe /T /F /PID $p.Id | Out-Null}catch{}}
 foreach($item in @(@{file=$stdout;key='stdoutBytes'},@{file=$stderr;key='stderrBytes'})){
  if(Test-Path $item.file){$report[$item.key]=(Get-Item $item.file).Length}
 }
 if(Test-Path $stderr){
  $raw=Get-Content $stderr -Raw -ErrorAction SilentlyContinue
  $report.stderrMarkers=@('MODULE_NOT_FOUND','ERR_MODULE_NOT_FOUND','ENOENT',
   'EACCES','EPERM','EADDRINUSE','UNHANDLED_REJECTION','Failed to launch',
   'server did not start') | Where-Object {$raw -match [regex]::Escape($_)}
 }
 # Disposable test runner uses synthetic data. Redact probable credentials and
 # user paths before emitting bounded diagnostics into public Actions evidence.
 foreach($stream in @(
   @{file=$stdout;key='stdoutExcerpt'},
   @{file=$stderr;key='stderrExcerpt'}
 )){
   if(Test-Path $stream.file){
     $raw=[string](Get-Content -LiteralPath $stream.file -Raw -ErrorAction SilentlyContinue)
     $safe=$raw -replace '(?i)(password|token|secret|credential|authorization|api[_-]?key)(\s*[:=]\s*)[^\s,;]+','$1$2[REDACTED]'
     $safe=$safe -replace '(?i)(https?://)[^:\s/@]+:[^\s/@]+@','$1[REDACTED]@'
     $safe=$safe -replace '(?i)([A-Z]:\\Users\\)[^\\\r\n]+','$1[USER]'
     $safe=$safe -replace '[\x00-\x08\x0B\x0C\x0E-\x1F]',''
     if($safe.Length -gt 1400){$safe=$safe.Substring(0,1400)+' [TRUNCATED]'}
     $report[$stream.key]=$safe
   }
 }
 Write-Host "Unpacked Electron diagnostics: inherited run-as-node=$($report.inheritedElectronRunAsNode); stdout bytes=$($report.stdoutBytes); stderr bytes=$($report.stderrBytes)"
 if($report.stderrExcerpt){Write-Host "Sanitized Electron stderr: $($report.stderrExcerpt)"}
 $report | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $evidenceDir 'unpacked-runtime.json') -Encoding UTF8
}
