import {cpSync,existsSync,mkdirSync,readFileSync} from 'node:fs';
import {join,resolve,sep} from 'node:path';
import {createRequire} from 'node:module';

const root=process.cwd();
const standalone=join(root,'.next','standalone');
if(!existsSync(join(standalone,'server.js'))) {
  throw new Error('Next standalone server.js missing; run npm run build first');
}

const publicDir=join(root,'public');
if(existsSync(publicDir))cpSync(publicDir,join(standalone,'public'),{recursive:true});

const nextPackage=JSON.parse(readFileSync(join(root,'node_modules','next','package.json'),'utf8'));
const mustPackage=['next','react','react-dom'];
const runtimePackages=new Set([
  ...mustPackage,
  ...Object.keys(nextPackage.dependencies||{}),
  ...Object.keys(nextPackage.optionalDependencies||{})
]);

const copied=[];
for(const name of runtimePackages){
  if(!/^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/i.test(name))throw Error('INVALID_RUNTIME_PACKAGE_NAME');
  const components=name.split('/');
  const source=join(root,'node_modules',...components);
  if(!existsSync(join(source,'package.json'))){
    if(mustPackage.includes(name))throw Error('REQUIRED_NODE_RUNTIME_PACKAGE_MISSING_'+name);
    continue;
  }
  const destination=join(standalone,'node_modules',...components);
  mkdirSync(destination,{recursive:true});
  // Next 16 on Windows can omit parts of next from output tracing.
  // Merge verified lockfile-installed packages, not an arbitrary network fetch.
  cpSync(source,destination,{recursive:true,force:true,dereference:true});
  copied.push(name);
}

const standaloneRequire=createRequire(join(standalone,'server.js'));
for(const name of mustPackage){
  const actual=resolve(standaloneRequire.resolve(name));
  const expectedRoot=resolve(join(standalone,'node_modules',...name.split('/')));
  if(actual!==expectedRoot && !actual.startsWith(expectedRoot+sep)) {
    throw Error('STANDALONE_MODULE_ESCAPED_PACKAGE_'+name);
  }
}
console.log('standalone-package: READY, verified local Next/React runtime packages:',copied.join(', '));
