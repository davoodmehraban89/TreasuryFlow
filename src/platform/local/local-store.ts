import {existsSync,mkdirSync,readFileSync,renameSync,rmSync,writeFileSync} from 'node:fs';
import {dirname} from 'node:path';
import type {LocalStoreData} from '../application/types';

const empty=():LocalStoreData=>({
  version:1,
  meta:{organizationName:'TreasuryFlow'},
  accounts:[],
  beneficiaries:[],
  payments:[],
  audit:[]
});

export class LocalStore{
  constructor(private readonly file:string){}

  snapshot():LocalStoreData{
    if(!existsSync(this.file)) return empty();
    const parsed=JSON.parse(readFileSync(this.file,'utf8')) as Partial<LocalStoreData>;
    if(parsed.version!==1) throw new Error('unsupported local store version');
    return parsed as LocalStoreData;
  }

  update(mutator:(data:LocalStoreData)=>LocalStoreData){
    const before=this.snapshot();
    let next:LocalStoreData;
    try{
      next=mutator(structuredClone(before));
    }catch(error){
      rmSync(this.file+'.tmp',{force:true});
      throw error;
    }
    if(next.version!==1) throw new Error('unsupported local store version');
    mkdirSync(dirname(this.file),{recursive:true});
    const tmp=this.file+'.tmp';
    writeFileSync(tmp,JSON.stringify(next,null,2),'utf8');
    renameSync(tmp,this.file);
    return structuredClone(next);
  }
}

export function defaultLocalStorePath(){
  const base=process.env.LOCALAPPDATA||process.env.APPDATA||process.cwd();
  return `${base}\\TreasuryFlow\\data\\treasuryflow-local.json`;
}
