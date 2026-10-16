param([Parameter(Mandatory=$true)][string]$QaFolder)
$ErrorActionPreference='Stop'
$reportDir=Join-Path $env:RUNNER_TEMP 'mayan-vm-evidence'
New-Item -ItemType Directory -Path $reportDir -Force|Out-Null
$report=[ordered]@{binaryPresent=$false;framework472Plus=$false;networkRuleInstalled=$false;
 processStarted=$false;windowHandlePresent=$false;licenseActivation='UNVERIFIED';
 mayanFinancialOutput='NOT_TESTED';outcome='NOT_RUN'}
$process=$null
$ruleName="TreasuryFlow-Mayan-VM-$PID"
try{
 $exe=Join-Path $QaFolder 'Mayan.exe'
 if(!(Test-Path $exe)){throw 'MAYAN_ORIGINAL_EXE_NOT_PRESENT'}
 $report.binaryPresent=$true
 $file=[System.IO.File]::OpenRead($exe)
 try {
  $bytes=New-Object byte[] 2
  [void]$file.Read($bytes,0,2)
  if($bytes[0] -ne 77 -or $bytes[1] -ne 90){throw 'MAYAN_NOT_WINDOWS_PE'}
 }finally{$file.Dispose()}
 $reg=Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full' -ErrorAction SilentlyContinue
 if(!$reg -or $reg.Release -lt 461808){throw 'DOTNET_FRAMEWORK_472_REQUIRED'}
 $report.framework472Plus=$true
 # Do not run legacy banking EXE unless outbound traffic for that EXE is blocked.
 try{
  New-NetFirewallRule -DisplayName $ruleName -Direction Outbound -Action Block -Program $exe -Profile Any | Out-Null
  $report.networkRuleInstalled=$true
 }catch{throw 'MAYAN_NETWORK_ISOLATION_RULE_COULD_NOT_BE_CREATED'}
 $process=Start-Process -FilePath $exe -WorkingDirectory $QaFolder -PassThru
 $report.processStarted=$true
 Start-Sleep -Seconds 9
 $process.Refresh()
 if(!$process.HasExited){$report.windowHandlePresent=($process.MainWindowHandle -ne [IntPtr]::Zero)}
 $report.outcome=if($process.HasExited){'LAUNCHED_BUT_EXITED_OR_REQUIRES_CONFIG'}else{'PROCESS_ALIVE_GUI_NOT_VALIDATED'}
 'Mayan actual Windows PE was started with outbound program firewall block; bank outputs and activation remain unverified.' >> $env:GITHUB_STEP_SUMMARY
}catch{
 $report.outcome='BLOCKED_OR_FAILED'
 $report.failureCode=$_.Exception.Message
 throw
}finally{
 if($process -and !$process.HasExited){try{Stop-Process -Id $process.Id -Force -ErrorAction Stop}catch{}}
 if($report.networkRuleInstalled){try{Remove-NetFirewallRule -DisplayName $ruleName -ErrorAction Stop}catch{}}
 $report|ConvertTo-Json -Depth 3 |Set-Content (Join-Path $reportDir 'mayan-gui.json') -Encoding UTF8
}
