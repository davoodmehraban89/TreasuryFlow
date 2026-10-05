import {describe,expect,it} from 'vitest'; import {redactTelemetry} from './observability';
describe('secure telemetry',()=>{it('redacts account identifiers and secrets',()=>expect(redactTelemetry({event:'dispatch',iban:'IR123',token:'abc',paymentId:'p1'})).toEqual({event:'dispatch',iban:'[REDACTED]',token:'[REDACTED]',paymentId:'p1'}))});
