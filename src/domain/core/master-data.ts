import {validateIranianIban} from '../iran/iban'; import type {Role} from '../authorization';
export type TenantRef={tenantId:string}; export type UserRef=TenantRef&{userId:string};
export function assignRole(user:UserRef,tenantId:string,role:Role){if(user.tenantId!==tenantId)throw new Error('cross-tenant role assignment');return {...user,role};}
export function createBankAccount(x:TenantRef&{id:string;iban:string}){if(!validateIranianIban(x.iban))throw new Error('invalid Iranian IBAN');return {...x,iban:x.iban.replace(/\s/g,'').toUpperCase()};}
export function createBeneficiary(x:TenantRef&{id:string;name:string;accountTenantId:string}){if(x.tenantId!==x.accountTenantId)throw new Error('cross-tenant beneficiary account');if(!x.name.trim())throw new Error('beneficiary name required');return {...x,name:x.name.trim()};}
