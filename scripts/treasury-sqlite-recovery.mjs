#!/usr/bin/env node
// Local offline-only recovery utility. Never overwrite the active database.
import {existsSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {
  createVerifiedSqliteBackup,
  restoreVerifiedSqliteBackupToNewPath,
  verifyTreasurySqliteBackup
} from '../src/platform/local/verified-sqlite-backup.ts';

const [operation,source,target,...extra]=process.argv.slice(2);
const valid=extra.length===0&&(
  (operation==='verify'&&typeof source==='string'&&target===undefined)||
  (['backup','restore-new'].includes(operation)&&typeof source==='string'&&typeof target==='string')
);
if(!valid){
  console.error('USAGE: verify <file> | backup <existing-db> <new-backup> | restore-new <verified-backup> <new-db>');
  process.exitCode=2;
}else{
  try{
    if(!existsSync(source))throw Error('SQLITE_RECOVERY_SOURCE_MISSING');
    let result;
    if(operation==='verify')result=verifyTreasurySqliteBackup(source);
    else if(operation==='restore-new')result=restoreVerifiedSqliteBackupToNewPath(source,target);
    else{
      // Write-open only for a consistent SQLite VACUUM INTO snapshot. The
      // database schema and existing payment state must never be changed.
      const db=new DatabaseSync(source);
      try{result=createVerifiedSqliteBackup(db,target)}
      finally{db.close()}
    }
    console.log(JSON.stringify({operation,status:'VERIFIED',...result}));
  }catch(error){
    // Never print credentials, local data or raw file paths in failure logs.
    const msg=error instanceof Error?error.message:'UNKNOWN';
    const allowed=[
      'SQLITE_BACKUP_DESTINATION_EXISTS',
      'SQLITE_RESTORE_WOULD_OVERWRITE_EXISTING_DATA',
      'SQLITE_BACKUP_INTEGRITY_FAILED',
      'SQLITE_BACKUP_UNSUPPORTED_SCHEMA',
      'SQLITE_BACKUP_REQUIRED_TABLE_MISSING',
      'SQLITE_BACKUP_VERIFICATION_MISMATCH',
      'SQLITE_RESTORE_VERIFICATION_MISMATCH',
      'SQLITE_RECOVERY_SOURCE_MISSING'
    ];
    console.error('RECOVERY_FAILED_'+(allowed.includes(msg)?msg:'SQLITE_OPERATION_REJECTED'));
    process.exitCode=1;
  }
}
