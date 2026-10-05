export type ApprovalActor={actorId:string;makerId:string}; export type Approval={approvedVersion:number};
export function canApprove(actor:ApprovalActor,paymentVersion:number){return actor.actorId!==actor.makerId && Number.isSafeInteger(paymentVersion) && paymentVersion>0;}
export function isApprovalValid(approval:Approval,currentVersion:number){return approval.approvedVersion===currentVersion;}
