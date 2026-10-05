import type {LocalStoreData} from './types';
export interface TreasuryStore{snapshot():LocalStoreData;update(mutator:(data:LocalStoreData)=>LocalStoreData):LocalStoreData}
