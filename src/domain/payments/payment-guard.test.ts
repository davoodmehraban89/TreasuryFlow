import {describe,expect,it} from 'vitest';
import {evaluatePaymentGuard} from './payment-guard';
const base={sourceAccountId:'a1',beneficiaryId:'b1',iban:'IR062960000000100324200001',amountIrr:1000,clientReference:'R-1',paymentDate:'2026-10-06'};
describe('Mayan-inspired payment guard',()=>{
 it('blocks duplicate client reference',()=>expect(evaluatePaymentGuard(base,[base])).toMatchObject({ok:false,code:'DUPLICATE_REFERENCE'}));
 it('blocks duplicate fingerprint even with another reference',()=>expect(evaluatePaymentGuard({...base,clientReference:'R-2'},[{...base,clientReference:'OLD'}])).toMatchObject({ok:false,code:'DUPLICATE_PAYMENT'}));
 it('rejects invalid Iranian IBAN',()=>expect(evaluatePaymentGuard({...base,iban:'IR000'},[])).toMatchObject({ok:false,code:'INVALID_IBAN'}));
 it('accepts a distinct valid payment',()=>expect(evaluatePaymentGuard(base,[])).toEqual({ok:true}));
});
