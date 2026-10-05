import {cpSync,existsSync} from 'node:fs';import {join} from 'node:path';
const standalone=join(process.cwd(),'.next','standalone');
if(!existsSync(standalone)) throw new Error('Next standalone output missing; run npm run build first');
const publicDir=join(process.cwd(),'public');if(existsSync(publicDir))cpSync(publicDir,join(standalone,'public'),{recursive:true});
console.log('standalone-package: READY');
