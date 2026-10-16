param([Parameter(Mandatory=$true)][string]$SourceRoot)
$ErrorActionPreference='Stop'
$evidenceDir=Join-Path $env:RUNNER_TEMP 'treasuryflow-vm-evidence'
New-Item -ItemType Directory $evidenceDir -Force | Out-Null
$report=[ordered]@{installerPresent=$false;installerSha256=$null;silentInstall='NOT_RUN';
 installedExecutableFound=$false;installedProcessLaunched=$false;httpReady=$false;
 bankAdapterDisabled=$false;homeHtmlLoaded=$false;installSeconds=0;installTimeoutSeconds=240;installerProcessExited=$false;outcome='NOT_RUN'}
$target=Join-Path $env:RUNNER_TEMP 'TreasuryFlow-VM-Installed'
$p=$null
try {
 $installers=@(Get-ChildItem -Path (Join-Path $SourceRoot 'release') -File -Filter 'TreasuryFlow-Setup-*-Windows-x64.exe')
 if($installers.Count -ne 1){throw 'EXPECTED_EXACTLY_ONE_NSIS_SETUP_EXE'}
 $setup=$installers[0].FullName
 $report.installerPresent=$true
 $report.installerSha256=(Get-FileHash $setup -Algorithm SHA256).Hash
 if(Test-Path $target){throw 'INSTALL_TEST_DIRECTORY_ALREADY_EXISTS'}
 # NSIS silent switch; /D=<path> must be the last argument.
 $stopwatch=[System.Diagnostics.Stopwatch]::StartNew()
 $setupProcess=Start-Process -FilePath $setup -ArgumentList @('/S',('/D='+$target)) -PassThru
 # Wait only for the NSIS installer PID, not the entire inherited process tree.
 # This follows Factor-easyPro's native Windows VM lab and has a hard timeout.
 if(!$setupProcess.WaitForExit(240000)){
   $report.installSeconds=[math]::Round($stopwatch.Elapsed.TotalSeconds,1)
   $report.installedExeSeenAtTimeout=@(Get-ChildItem -LiteralPath $target -Recurse -File -Filter 'TreasuryFlow.exe' -ErrorAction SilentlyContinue).Count -gt 0
   try{$setupProcess.Kill()}catch{}
   throw 'NSIS_INSTALL_TIMEOUT_AFTER_240_SECONDS'
 }
 $stopwatch.Stop()
 $report.installSeconds=[math]::Round($stopwatch.Elapsed.TotalSeconds,1)
 $report.installerProcessExited=$true
 if($setupProcess.ExitCode -ne 0){throw ('NSIS_INSTALLER_NONZERO_EXIT_'+$setupProcess.ExitCode)}
 if(!(Test-Path $target)){throw 'NSIS_INSTALL_LOCATION_NOT_CREATED'}
 $report.silentInstall='PASS'
 $apps=@(Get-ChildItem $target -Recurse -File -Filter 'TreasuryFlow.exe' -ErrorAction SilentlyContinue)
 if($apps.Count -ne 1){throw 'INSTALLED_EXE_NOT_FOUND'}
 $report.installedExecutableFound=$true
 $env:BANK_ADAPTER_MODE='disabled'
 $env:TREASURYFLOW_DATA_FILE=Join-Path $evidenceDir 'isolated-installed.sqlite'
 $p=Start-Process -FilePath $apps[0].FullName -WorkingDirectory $apps[0].DirectoryName -PassThru
 $report.installedProcessLaunched=$true
 for($i=0;$i -lt 90;$i++){
  Start-Sleep -Milliseconds 700
  try {
   $ready=Invoke-RestMethod 'http://127.0.0.1:3210/api/ready' -TimeoutSec 2
   if($ready.status -eq 'ready'){
    $report.httpReady=$true
    $report.bankAdapterDisabled=($ready.bankAdapter -eq 'disabled')
    break
   }
  }catch{}
 }
 if(!$report.httpReady){throw 'INSTALLED_APP_READINESS_TIMEOUT'}
 if(!$report.bankAdapterDisabled){throw 'INSTALLED_APP_BANK_NOT_DISABLED'}
 $homePage=Invoke-WebRequest 'http://127.0.0.1:3210' -TimeoutSec 12
 $report.homeHtmlLoaded=($homePage.StatusCode -eq 200 -and $homePage.Content -match 'TreasuryFlow')
 if(!$report.homeHtmlLoaded){throw 'INSTALLED_APP_HTML_FAILED'}
 $report.outcome='NSIS_INSTALL_AND_INSTALLED_RUNTIME_PASS'
 'A REAL NSIS Setup was silently installed under runner.temp, and the installed TreasuryFlow executable passed local readiness and HTML checks.' >> $env:GITHUB_STEP_SUMMARY
}catch {
 $report.outcome='FAIL'
 $report.failureCode=$_.Exception.Message
 throw
}finally {
 if($p -and !$p.HasExited){try{& taskkill.exe /T /F /PID $p.Id | Out-Null}catch{}}
 $report|ConvertTo-Json -Depth 4|Set-Content (Join-Path $evidenceDir 'installed-runtime.json') -Encoding UTF8
}
