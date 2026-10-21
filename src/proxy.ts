import {NextRequest, NextResponse} from 'next/server';
import {isProductionOperationBlocked} from './platform/identity/production-http-guard';

/**
 * Production requests must not reach tenant data, server actions, or
 * operational routes until external identity and infrastructure are provisioned.
 * No client-supplied header can bypass this gate.
 */
export function proxy(request:NextRequest){
  if(!isProductionOperationBlocked(process.env,request.nextUrl.pathname))return NextResponse.next();
  return new NextResponse('دسترسی عملیاتی مسدود است',{
    status:403,
    headers:{
      'Content-Type':'text/plain; charset=utf-8',
      'Cache-Control':'no-store',
      'X-Content-Type-Options':'nosniff',
      'X-Frame-Options':'DENY'
    }
  });
}

export const config={
  matcher:['/((?!_next/static/|_next/image(?:/|$)|favicon[.]ico$).*)']
};
