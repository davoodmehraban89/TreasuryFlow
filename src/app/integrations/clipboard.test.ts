import {describe,expect,it,vi} from 'vitest';
import {copyQueryText} from './clipboard';
describe('SQL query clipboard',()=>{
 it('copies exact edited SQL',async()=>{
  const original=Object.getOwnPropertyDescriptor(globalThis,'navigator');
  const writeText=vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{clipboard:{writeText}}});
  try{expect(await copyQueryText('SELECT TOP (7) X FROM dbo.Y')).toBe(true);
   expect(writeText).toHaveBeenCalledWith('SELECT TOP (7) X FROM dbo.Y');
  }finally{if(original)Object.defineProperty(globalThis,'navigator',original);
   else Reflect.deleteProperty(globalThis,'navigator');}
 });
 it('does not copy empty SQL',async()=>expect(await copyQueryText('')).toBe(false));
});
