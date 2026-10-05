import {LocalStore,defaultLocalStorePath} from '../local/local-store';
import {TreasuryService} from './treasury-service';
import type {ActorContext} from './types';

export function getDesktopTreasuryService(actor:ActorContext={tenantId:'local',userId:'local-maker',role:'MAKER'}){
  if(process.env.NODE_ENV==='production'&&process.env.TREASURYFLOW_DESKTOP_LOCAL!=='1'){
    throw new Error('desktop local service disabled in production');
  }
  return new TreasuryService(new LocalStore(process.env.TREASURYFLOW_DATA_FILE||defaultLocalStorePath()),actor);
}
