import {SqliteStore,defaultSqliteStorePath} from '../local/sqlite-store';
import {TreasuryService} from './treasury-service';
import type {ActorContext} from './types';
export function getDesktopTreasuryService(actor:ActorContext={tenantId:'local',userId:'local-maker',role:'MAKER'}){
  if(process.env.NODE_ENV==='production'&&process.env.TREASURYFLOW_DESKTOP_LOCAL!=='1') throw new Error('desktop local service disabled in production');
  return new TreasuryService(new SqliteStore(process.env.TREASURYFLOW_DATA_FILE||defaultSqliteStorePath()),actor);
}
