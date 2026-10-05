import {readFileSync,existsSync} from 'node:fs';
const file=process.argv[2]??'deploy/production-evidence.json';
if(!existsSync(file)){console.error('BLOCKED_EXTERNAL: evidence manifest not found: '+file);process.exit(2)}
const m=JSON.parse(readFileSync(file,'utf8'));
const paths=['database.endpointId','database.migration','database.rlsProof','identity.providerId','identity.mfaProof','identity.sessionProof','kms.keyId','kms.policyProof','security.wafPolicyId','security.siemPolicyId','security.alertDeliveryProof','recovery.restoreDrillId','recovery.integrityProof','bank.provider','bank.protocol','bank.sandboxProof','bank.certificationRef','bank.productionCertificateFingerprint','release.liveAuthorizationRef','release.canaryProof','release.rollbackProof'];
const get=p=>p.split('.').reduce((o,k)=>o?.[k],m); const missing=paths.filter(p=>{const v=get(p);return typeof v!=='string'||!v.trim()||v.startsWith('__')});
if(!(Number.isFinite(m?.recovery?.rpoMinutes)&&m.recovery.rpoMinutes>=0&&m.recovery.rpoMinutes<=15))missing.push('recovery.rpoMinutes');
if(!(Number.isFinite(m?.recovery?.rtoMinutes)&&m.recovery.rtoMinutes>=0&&m.recovery.rtoMinutes<=60))missing.push('recovery.rtoMinutes');
const secret=/(password\s*=|secret\s*=|token\s*=|private[_-]?key\s*=|api[_-]?key\s*=)/i; if(paths.some(p=>secret.test(String(get(p)??'')))){console.error('Unsafe secret-like value detected in evidence references');process.exit(3)}
if(missing.length){console.error('BLOCKED_EXTERNAL: missing/placeholder evidence: '+missing.join(', '));process.exit(2)}
console.log('external-evidence: VERIFIED');
