import {afterEach,describe,expect,it,vi} from 'vitest';
import {mkdtempSync,readFileSync,rmSync,writeFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {SqliteStore} from './sqlite-store';
import {restoreVerifiedSqliteBackupToNewPath,verifyTreasurySqliteBackup} from './verified-sqlite-backup';
import {TreasuryService} from '../application/treasury-service';
import type {BankAdapter} from '../../domain/bank-adapter';

const dirs:string[]=[];
const iban='IR062960000000100324200001';
afterEach(()=>{for(const d of dirs.splice(0))rmSync(d,{recursive:true,force:true})});
function fixture(){
  const dir=mkdtempSync(join(tmpdir(),'tf-sqlite-backup-'));
  dirs.push(dir);
  const file=join(dir,'live.sqlite');
  const store=new SqliteStore(file);
  const maker=new TreasuryService(store,{tenantId:'local',userId:'maker',role:'MAKER'});
  maker.createAccount({id:'account-1',name:'synthetic account',bankName:'test',iban});
  maker.createBeneficiary({id:'beneficiary-1',name:'synthetic payee',iban,whitelisted:true});
  maker.createPayment({id:'payment-1',sourceAccountId:'account-1',beneficiaryId:'beneficiary-1',
    amountIrr:1234567,paymentDate:'2026-10-23',clientReference:'BACKUP-ONLY',description:''});
  return {dir,file,store,maker};
}

describe('verified SQLite backup and recovery without operational overwrite',()=>{
  it('backs up a live WAL-connected store preserving payment, beneficiaries and exact audit',()=>{
    const {dir,store}=fixture();
    const expected=store.snapshot();
    const target=join(dir,'backup','treasuryflow.sqlite');
    const counts=store.backupTo(target);
    expect(counts).toMatchObject({schemaVersion:1,accounts:1,beneficiaries:1,payments:1,audit:3});
    expect(verifyTreasurySqliteBackup(target)).toEqual(counts);
    const restored=join(dir,'recovery','treasuryflow-restored.sqlite');
    expect(restoreVerifiedSqliteBackupToNewPath(target,restored)).toEqual(counts);
    const recovered=new SqliteStore(restored);
    try{
      expect(recovered.snapshot()).toEqual(expected);
      expect(recovered.snapshot().payments[0]).toMatchObject({
        amountIrr:1234567,clientReference:'BACKUP-ONLY',state:'DRAFT'
      });
    }finally{recovered.close();store.close()}
  });
  it('does not overwrite any destination, even an empty file, and preserves original bytes',()=>{
    const {dir,store}=fixture();
    const dest=join(dir,'keep.sqlite');
    writeFileSync(dest,'EXISTING_SECRET_DO_NOT_OVERWRITE');
    expect(()=>store.backupTo(dest)).toThrow('SQLITE_BACKUP_DESTINATION_EXISTS');
    expect(readFileSync(dest,'utf8')).toBe('EXISTING_SECRET_DO_NOT_OVERWRITE');
    const backup=join(dir,'backup.sqlite');
    store.backupTo(backup);
    expect(()=>restoreVerifiedSqliteBackupToNewPath(backup,dest)).toThrow('SQLITE_RESTORE_WOULD_OVERWRITE_EXISTING_DATA');
    expect(readFileSync(dest,'utf8')).toBe('EXISTING_SECRET_DO_NOT_OVERWRITE');
    const empty=join(dir,'empty.sqlite');writeFileSync(empty,'');
    expect(()=>store.backupTo(empty)).toThrow('SQLITE_BACKUP_DESTINATION_EXISTS');
    expect(readFileSync(empty,'utf8')).toBe('');
    store.close();
  });
  it('rejects invalid and truncated backups without creating a destination',()=>{
    const {dir,store}=fixture();
    const corrupted=join(dir,'bad.sqlite');
    writeFileSync(corrupted,'not a database');
    const dest=join(dir,'must-not-be-created.sqlite');
    expect(()=>restoreVerifiedSqliteBackupToNewPath(corrupted,dest)).toThrow();
    expect(existsSync(dest)).toBe(false);
    const backup=join(dir,'valid.sqlite');
    store.backupTo(backup);
    const original=readFileSync(backup);
    writeFileSync(backup,original.subarray(0,512));
    expect(()=>verifyTreasurySqliteBackup(backup)).toThrow();
    expect(()=>restoreVerifiedSqliteBackupToNewPath(backup,dest)).toThrow();
    expect(existsSync(dest)).toBe(false);
    store.close();
  });
  it('captures committed WAL records without checkpointing or interrupting writes',()=>{
    const {dir,file,store,maker}=fixture();
    maker.createAccount({id:'account-2',name:'second',bankName:'test',iban});
    const other=new DatabaseSync(file);
    try{
      const journal=other.prepare('PRAGMA journal_mode').get() as {journal_mode:string};
      expect(journal.journal_mode.toLowerCase()).toBe('wal');
      const dest=join(dir,'wal-backup.sqlite');
      expect(store.backupTo(dest).accounts).toBe(2);
      expect(verifyTreasurySqliteBackup(dest).audit).toBe(4);
      maker.createAccount({id:'account-3',name:'third',bankName:'test',iban});
      expect(verifyTreasurySqliteBackup(dest).accounts).toBe(2);
      expect(store.snapshot().accounts).toHaveLength(3);
    }finally{other.close();store.close()}
  });
  it('restored UNKNOWN payments remain blocked from bank resubmission',async()=>{
    const {dir,store,maker}=fixture();
    maker.submitPayment('payment-1');
    const checker=new TreasuryService(store,{tenantId:'local',userId:'checker',role:'CHECKER'});
    checker.approvePayment('payment-1');
    checker.queuePayment('payment-1');
    const failedAdapter:BankAdapter={submit:vi.fn().mockRejectedValue(Error('synthetic timeout')),poll:vi.fn()};
    await expect(checker.dispatchPayment('payment-1',failedAdapter)).rejects.toThrow(/manual review/i);
    expect(checker.getPayment('payment-1').state).toBe('UNKNOWN');
    const backup=join(dir,'unknown-backup.sqlite');
    store.backupTo(backup);
    const newDb=join(dir,'unknown-restored.sqlite');
    restoreVerifiedSqliteBackupToNewPath(backup,newDb);
    const restored=new SqliteStore(newDb);
    try{
      const recovered=new TreasuryService(restored,{tenantId:'local',userId:'checker',role:'CHECKER'});
      expect(recovered.getPayment('payment-1').state).toBe('UNKNOWN');
      const blocked:BankAdapter={submit:vi.fn(),poll:vi.fn()};
      await expect(recovered.dispatchPayment('payment-1',blocked)).rejects.toThrow('payment not eligible for dispatch');
      expect(blocked.submit).not.toHaveBeenCalled();
      expect(recovered.listAudit().some(a=>a.action==='PAYMENT_BANK_UNKNOWN')).toBe(true);
    }finally{restored.close();store.close()}
  });
  it('restored in-flight DISPATCHING reservation cannot automatically replay a bank transfer',async()=>{
    const {dir,store,maker}=fixture();
    maker.submitPayment('payment-1');
    const checker=new TreasuryService(store,{tenantId:'local',userId:'checker',role:'CHECKER'});
    checker.approvePayment('payment-1');
    checker.queuePayment('payment-1');
    let resolveFirst:(value:{outcome:'ACCEPTED';bankReference:string})=>void=()=>{};
    const pending=new Promise<{outcome:'ACCEPTED';bankReference:string}>(resolve=>{resolveFirst=resolve});
    const source:BankAdapter={submit:vi.fn(()=>pending),poll:vi.fn()};
    const first=checker.dispatchPayment('payment-1',source);
    expect(checker.getPayment('payment-1').state).toBe('DISPATCHING');
    const backup=join(dir,'dispatching-backup.sqlite');
    store.backupTo(backup);
    const dest=join(dir,'dispatching-restored.sqlite');
    restoreVerifiedSqliteBackupToNewPath(backup,dest);
    const restored=new SqliteStore(dest);
    try{
      const recovered=new TreasuryService(restored,{tenantId:'local',userId:'checker',role:'CHECKER'});
      expect(recovered.getPayment('payment-1').state).toBe('DISPATCHING');
      const blocked:BankAdapter={submit:vi.fn(),poll:vi.fn()};
      await expect(recovered.dispatchPayment('payment-1',blocked)).rejects.toThrow('payment not eligible for dispatch');
      expect(blocked.submit).not.toHaveBeenCalled();
      expect(recovered.listAudit().filter(a=>a.action==='PAYMENT_DISPATCH_RESERVED')).toHaveLength(1);
    }finally{
      restored.close();
      resolveFirst({outcome:'ACCEPTED',bankReference:'SYNTHETIC-ACK'});
      await first;
      store.close();
    }
  });
  it('fails closed on an unexpected schema version without mutating the source',()=>{
    const {dir,file,store}=fixture();
    const backup=join(dir,'bad-version.sqlite');
    store.backupTo(backup);
    const source=new DatabaseSync(backup);
    source.prepare("UPDATE meta SET value='99' WHERE key='schema_version'").run();
    source.close();
    expect(()=>verifyTreasurySqliteBackup(backup)).toThrow('SQLITE_BACKUP_UNSUPPORTED_SCHEMA');
    expect(verifyTreasurySqliteBackup(file).schemaVersion).toBe(1);
    store.close();
  });
});
