param([Parameter(Mandatory=$true)][string]$InstalledFolder)
$ErrorActionPreference='Stop'
$evidence=Join-Path $env:RUNNER_TEMP 'treasuryflow-vm-evidence'
New-Item -ItemType Directory -Path $evidence -Force | Out-Null
$report=[ordered]@{
 schema='treasuryflow-windows-nsis-uninstall-v1'
 mode='ACTUAL_INSTALLED_NSIS_UNINSTALL'
 installerRootFound=$false
 uninstallerFound=$false
 uninstallerExitCode=$null
 executableRemoved=$false
 outcome='NOT_RUN'
}
try{
 if(!(Test-Path -LiteralPath $InstalledFolder)){throw 'INSTALLED_FOLDER_MISSING'}
 $report.installerRootFound=$true
 $apps=@(Get-ChildItem -LiteralPath $InstalledFolder -Recurse -File -Filter 'TreasuryFlow.exe' -ErrorAction SilentlyContinue)
 if($apps.Count -ne 1){throw 'INSTALLED_EXE_NOT_UNIQUE'}
 $uninstallers=@(Get-ChildItem -LiteralPath $InstalledFolder -Recurse -File -ErrorAction SilentlyContinue |
  Where-Object {$_.Name -match '^uninstall.*\.exe$'})
 if($uninstallers.Count -ne 1){throw 'NSIS_UNINSTALLER_NOT_UNIQUE'}
 $report.uninstallerFound=$true
 $process=Start-Process -FilePath $uninstallers[0].FullName -ArgumentList '/S' -PassThru
 if(!$process.WaitForExit(90000)){
  try{$process.Kill()}catch{}
  throw 'NSIS_UNINSTALL_TIMEOUT'
 }
 $report.uninstallerExitCode=$process.ExitCode
 if($process.ExitCode -ne 0){throw 'NSIS_UNINSTALL_NONZERO_EXIT'}
 Start-Sleep -Seconds 2
 $report.executableRemoved=!(Test-Path -LiteralPath $apps[0].FullName)
 if(!$report.executableRemoved){throw 'NSIS_UNINSTALL_LEFT_INSTALLED_EXE'}
 $report.outcome='NSIS_REAL_UNINSTALL_PASS'
 'Uninstalled real disposable TreasuryFlow NSIS installation with /S and verified EXE removal.' >> $env:GITHUB_STEP_SUMMARY
}catch{
 $report.outcome='FAILED'
 $report.failureCode=$_.Exception.Message
 throw
}finally{
 $report | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $evidence 'uninstall-runtime.json') -Encoding UTF8
}
