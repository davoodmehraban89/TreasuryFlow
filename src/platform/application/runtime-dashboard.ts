import type {RequestContext} from '../identity/request-context';import type {OperationsRepository} from './dashboard-service';import {getDashboard} from './dashboard-service';
export async function loadProductionDashboard(ctx:RequestContext|null,repo:OperationsRepository){if(!ctx)return{status:'AUTH_REQUIRED' as const};return{status:'READY' as const,data:await getDashboard(ctx,repo)}}
