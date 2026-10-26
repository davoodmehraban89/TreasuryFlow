import {describe,it,expect} from 'vitest';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {isExpectedReadiness}=require('./ready-check.cjs') as {isExpectedReadiness:(status:number,body:unknown)=>boolean};
describe('Electron localhost strict readiness gate',()=>{
 const ready=JSON.stringify({status:'ready',bankAdapter:'disabled',missing:[]});
 it('accepts only authentic expected schema with HTTP 200',()=>{
   expect(isExpectedReadiness(200,ready)).toBe(true);
   expect(isExpectedReadiness(201,ready)).toBe(false);
   expect(isExpectedReadiness(302,ready)).toBe(false);
   expect(isExpectedReadiness(404,ready)).toBe(false);
   expect(isExpectedReadiness(503,ready)).toBe(false);
 });
 it('rejects stale local servers, non-JSON and bank-enabled responses',()=>{
   for(const body of ['<html>Welcome</html>','not-json','',
     '{"status":"not-ready","bankAdapter":"disabled"}',
     '{"status":"ready","bankAdapter":"live"}',
     '{"status":"ready","bankAdapter":"sandbox"}',
     '{"status":"ready"}',
     JSON.stringify({status:'ready',bankAdapter:'disabled',junk:'x'.repeat(5000)})]){
     expect(isExpectedReadiness(200,body)).toBe(false);
   }
 });
 it('never accepts objects supplied as body, arrays or JSON scalar',()=>{
   for(const body of [{status:'ready',bankAdapter:'disabled'},'null','[]','true','4']){
     expect(isExpectedReadiness(200,body)).toBe(false);
   }
 });
});
