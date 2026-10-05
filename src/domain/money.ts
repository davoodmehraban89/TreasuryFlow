export type RialAmount = number & {readonly __rial: unique symbol};
export function rial(value:number):RialAmount { if(!Number.isSafeInteger(value)||value<0) throw new Error('IRR amount must be a non-negative safe integer'); return value as RialAmount; }
