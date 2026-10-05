import type {ReactNode} from 'react';
import type {ActorContext} from '../../platform/application/types';

type Role=ActorContext['role'];
export function PermissionBoundary({role,allowed,children}:{role:Role;allowed:Role[];children:ReactNode}){
 if(!allowed.includes(role)) return <div className="permission-denied" role="alert"><strong>دسترسی کافی ندارید</strong><span>این بخش برای نقش فعلی مجاز نیست.</span></div>;
 return <>{children}</>;
}
