param([string]$DatabaseUrl=$env:DATABASE_URL)
if(-not $DatabaseUrl){Write-Error 'DATABASE_URL is required for real PostgreSQL RLS integration proof'; exit 2}
if(-not (Get-Command psql -ErrorAction SilentlyContinue)){Write-Error 'psql is required';exit 2}
$env:PGOPTIONS='-c app.tenant_id=t1'
psql $DatabaseUrl -v ON_ERROR_STOP=1 -f migrations/001_production_core.sql
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
Write-Output 'Migration applied. Execute environment-specific cross-tenant fixture verification before recording production evidence.'
