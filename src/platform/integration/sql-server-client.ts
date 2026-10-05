import sql from 'mssql';
import type {ExternalSqlServerConfig} from './sql-server-adapter';

type Driver={connect:(config:any)=>Promise<any>};
export class SqlServerAccountingAdapter{
 constructor(private config:ExternalSqlServerConfig,private driver:Driver=sql as unknown as Driver,private approvedWriteContract?:string){}
 private driverConfig(){const c:any={server:this.config.server,database:this.config.database,options:{encrypt:this.config.encrypt??false,trustServerCertificate:this.config.trustServerCertificate??true}};if(this.config.auth==='sql'){c.user=this.config.user;c.password=this.config.password}else{c.options.trustedConnection=true}return c}
 private async withPool<T>(fn:(pool:any)=>Promise<T>){const pool=await this.driver.connect(this.driverConfig());try{return await fn(pool)}finally{await pool.close()}}
 async testConnection(){return this.withPool(async pool=>{const r=await pool.request().query('SELECT 1 AS ok');return {ok:Number(r.recordset?.[0]?.ok)===1}})}
 async inspectSchema(){return this.withPool(async pool=>(await pool.request().query(`SELECT TABLE_SCHEMA AS schema_name,TABLE_NAME AS table_name,COLUMN_NAME AS column_name,DATA_TYPE AS data_type FROM INFORMATION_SCHEMA.COLUMNS ORDER BY TABLE_SCHEMA,TABLE_NAME,ORDINAL_POSITION`)).recordset)}
 async executeApprovedWrite(_operation:string,_params:Record<string,unknown>){if(!this.approvedWriteContract)throw new Error('approved write contract required');throw new Error('write contract implementation not installed')}
}
