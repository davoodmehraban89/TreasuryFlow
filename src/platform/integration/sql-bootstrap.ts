export type SqlBootstrapConfig={server:string;database:string;auth:{mode:'windows'}|{mode:'sql';user:string;password:string}};
export type AccountingSchema={tables:string[];procedures:string[]};
export type BootstrapPlan={compatible:boolean;reason?:string;statements:string[]};

export function validateSqlBootstrapConfig(config:SqlBootstrapConfig){
  if(!config.server.trim()) throw new Error('SQL Server is required');
  if(!config.database.trim()) throw new Error('SQL database is required');
  if(config.auth.mode==='sql'&&(!config.auth.user.trim()||!config.auth.password)) throw new Error('SQL credentials are required');
  return config;
}

export function planTreasuryFlowBootstrap(schema:AccountingSchema):BootstrapPlan{
  const names=new Set(schema.tables.map(x=>x.toLowerCase()));
  const compatible=names.has('sanad')&&names.has('havale');
  if(!compatible) return {compatible:false,reason:'Accounting/Peyvast schema signature not detected',statements:[]};
  return {compatible:true,statements:[
    "IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name=N'TreasuryFlow') EXEC(N'CREATE SCHEMA TreasuryFlow')",
    "IF OBJECT_ID(N'TreasuryFlow.SchemaMigrations',N'U') IS NULL CREATE TABLE TreasuryFlow.SchemaMigrations (Version int NOT NULL PRIMARY KEY, AppliedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME())"
  ]};
}
