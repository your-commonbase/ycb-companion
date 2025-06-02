// transactionFunctions.ts

import {
  addEntry as apiAddEntry,
  updateEntry as apiUpdateEntry,
} from '@/helpers/functions';

import type { Transaction, TransactionContext } from './transactionManager';

export const createEntryTransaction = (
  tempId: string,
  data: string,
  metadata: any,
): Transaction => {
  return async (context: TransactionContext) => {
    const response = await apiAddEntry(data, metadata);
    const actualId = response.respData.id;

    // Update the idMapping
    context.idMapping.set(tempId, actualId);
    return actualId;
  };
};

export const updateEntryTransaction = (
  id: string,
  data: string,
  metadata: any,
): Transaction => {
  return async (context: TransactionContext) => {
    // Resolve ID if it's a temporary ID
    const actualId = context.idMapping.get(id) || id;
    await apiUpdateEntry(actualId, data, metadata);
  };
};
