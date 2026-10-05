import type {ReactNode} from 'react';

type Kind='empty'|'loading'|'error'|'success';
export function StateView({kind,title,description,action}:{kind:Kind;title:string;description?:string;action?:ReactNode}){
 return <section className={'state-view state-'+kind} role={kind==='error'?'alert':'status'} aria-live="polite">
  <span className="state-symbol" aria-hidden>{kind==='error'?'!':kind==='success'?'✓':kind==='loading'?'…':'○'}</span>
  <strong>{title}</strong>{description&&<p>{description}</p>}{action&&<div className="state-action">{action}</div>}
 </section>;
}
