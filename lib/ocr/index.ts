export * from './types';
export { detectSource, parsePage, SOURCE_PARSERS, type PageResult } from './registry';
export {
  dedupeOperations, externalRefOf, canonicalRef,
  type ExistingTransaction, type DuplicateReason, type DedupedOperation,
} from './dedupe';
