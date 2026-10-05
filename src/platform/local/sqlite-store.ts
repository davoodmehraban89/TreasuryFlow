import {mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import type {LocalStoreData,LocalAccount,LocalBeneficiary,LocalPayment,LocalAudit} from '../application/types';

const empty=():LocalStoreData=>({
  version:1,
  meta:{organizationName:'TreasuryFlow'},
  accounts:[],
  beneficiaries:[],
  payments:[],
  audit:[]
});

export class SqliteStore{
  private readonly db:DatabaseSync;

  constructor(private readonly file:string){
    mkdirSync(dirname(file),{recursive:true});
    this.db=new DatabaseSync(file);
    this.db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;');
    this.migrate();
  }

  private migrate(){
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        name TEXT NOT NULL,
        iban TEXT NOT NULL,
        bank_name TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('ACTIVE','INACTIVE')),
        PRIMARY KEY (tenant_id,id)
      );
      CREATE TABLE IF NOT EXISTS beneficiaries (
        id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        name TEXT NOT NULL,
        iban TEXT NOT NULL,
        whitelisted INTEGER NOT NULL CHECK(whitelisted IN (0,1)),
        PRIMARY KEY (tenant_id,id)
      );
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        maker_id TEXT NOT NULL,
        source_account_id TEXT NOT NULL,
        beneficiary_id TEXT NOT NULL,
        amount_irr INTEGER NOT NULL CHECK(amount_irr > 0),
        payment_date TEXT NOT NULL,
        client_reference TEXT NOT NULL,
        description TEXT NOT NULL,
        version INTEGER NOT NULL CHECK(version > 0),
        state TEXT NOT NULL,
        approved_version INTEGER,
        bank_reference TEXT,
        PRIMARY KEY (tenant_id,id),
        UNIQUE (tenant_id,client_reference)
      );
      CREATE TABLE IF NOT EXISTS audit (
        tenant_id TEXT NOT NULL,
        seq INTEGER NOT NULL,
        actor TEXT NOT NULL,
        action TEXT NOT NULL,
        entity TEXT NOT NULL,
        at INTEGER NOT NULL,
        PRIMARY KEY (tenant_id,seq)
      );
      CREATE INDEX IF NOT EXISTS idx_payments_tenant_state ON payments(tenant_id,state);
      CREATE INDEX IF NOT EXISTS idx_payments_tenant_date ON payments(tenant_id,payment_date);
      CREATE INDEX IF NOT EXISTS idx_audit_tenant_at ON audit(tenant_id,at);
    `);
    const version=this.db.prepare("SELECT value FROM meta WHERE key='schema_version'").get() as {value?:string}|undefined;
    if(version&&version.value!=='1') throw new Error('unsupported sqlite schema version');
    this.db.prepare("INSERT OR IGNORE INTO meta(key,value) VALUES('schema_version','1')").run();
    this.db.prepare("INSERT OR IGNORE INTO meta(key,value) VALUES('organization_name','TreasuryFlow')").run();
  }

  snapshot():LocalStoreData{
    const organization=(this.db.prepare("SELECT value FROM meta WHERE key='organization_name'").get() as {value?:string}|undefined)?.value??'TreasuryFlow';
    const accounts=(this.db.prepare('SELECT id,tenant_id,name,iban,bank_name,status FROM accounts ORDER BY rowid').all() as any[]).map((r):LocalAccount=>({
      id:String(r.id),tenantId:String(r.tenant_id),name:String(r.name),iban:String(r.iban),bankName:String(r.bank_name),status:r.status as LocalAccount['status']
    }));
    const beneficiaries=(this.db.prepare('SELECT id,tenant_id,name,iban,whitelisted FROM beneficiaries ORDER BY rowid').all() as any[]).map((r):LocalBeneficiary=>({
      id:String(r.id),tenantId:String(r.tenant_id),name:String(r.name),iban:String(r.iban),whitelisted:Number(r.whitelisted)===1
    }));
    const payments=(this.db.prepare('SELECT * FROM payments ORDER BY rowid').all() as any[]).map((r):LocalPayment=>({
      id:String(r.id),tenantId:String(r.tenant_id),makerId:String(r.maker_id),sourceAccountId:String(r.source_account_id),beneficiaryId:String(r.beneficiary_id),amountIrr:Number(r.amount_irr),paymentDate:String(r.payment_date),clientReference:String(r.client_reference),description:String(r.description),version:Number(r.version),state:r.state as LocalPayment['state'],approvedVersion:r.approved_version==null?undefined:Number(r.approved_version),bankReference:r.bank_reference==null?undefined:String(r.bank_reference)
    }));
    const audit=(this.db.prepare('SELECT tenant_id,seq,actor,action,entity,at FROM audit ORDER BY tenant_id,seq').all() as any[]).map((r):LocalAudit=>({
      tenantId:String(r.tenant_id),seq:Number(r.seq),actor:String(r.actor),action:String(r.action),entity:String(r.entity),at:Number(r.at)
    }));
    return {version:1,meta:{organizationName:organization},accounts,beneficiaries,payments,audit};
  }

  update(mutator:(data:LocalStoreData)=>LocalStoreData){
    const next=mutator(structuredClone(this.snapshot()));
    if(next.version!==1) throw new Error('unsupported sqlite schema version');
    this.db.exec('BEGIN IMMEDIATE');
    try{
      this.db.prepare("UPDATE meta SET value=? WHERE key='organization_name'").run(next.meta.organizationName);
      this.db.exec('DELETE FROM audit; DELETE FROM payments; DELETE FROM beneficiaries; DELETE FROM accounts;');
      const accountStmt=this.db.prepare('INSERT INTO accounts(id,tenant_id,name,iban,bank_name,status) VALUES(?,?,?,?,?,?)');
      for(const a of next.accounts) accountStmt.run(a.id,a.tenantId,a.name,a.iban,a.bankName,a.status);
      const beneficiaryStmt=this.db.prepare('INSERT INTO beneficiaries(id,tenant_id,name,iban,whitelisted) VALUES(?,?,?,?,?)');
      for(const b of next.beneficiaries) beneficiaryStmt.run(b.id,b.tenantId,b.name,b.iban,b.whitelisted?1:0);
      const paymentStmt=this.db.prepare('INSERT INTO payments(id,tenant_id,maker_id,source_account_id,beneficiary_id,amount_irr,payment_date,client_reference,description,version,state,approved_version,bank_reference) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)');
      for(const p of next.payments) paymentStmt.run(p.id,p.tenantId,p.makerId,p.sourceAccountId,p.beneficiaryId,p.amountIrr,p.paymentDate,p.clientReference,p.description,p.version,p.state,p.approvedVersion??null,p.bankReference??null);
      const auditStmt=this.db.prepare('INSERT INTO audit(tenant_id,seq,actor,action,entity,at) VALUES(?,?,?,?,?,?)');
      for(const a of next.audit) auditStmt.run(a.tenantId,a.seq,a.actor,a.action,a.entity,a.at);
      this.db.exec('COMMIT');
    }catch(error){
      this.db.exec('ROLLBACK');
      throw error;
    }
    return structuredClone(next);
  }

  close(){this.db.close()}
}

export function defaultSqliteStorePath(){
  const base=process.env.LOCALAPPDATA||process.env.APPDATA||process.cwd();
  return `${base}\\TreasuryFlow\\data\\treasuryflow.db`;
}
