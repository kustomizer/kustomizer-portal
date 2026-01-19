/**
 * Explicit ID types for bigint/int8 columns from Supabase
 *
 * IMPORTANT: With Supabase/PostgREST, int8 (bigint) values come as strings in JSON
 * to avoid JavaScript number precision issues. Always treat these as strings.
 *
 * @see https://supabase.com/docs/guides/api/rest/postgres-types#bigint-int8
 */

export type StoreDomain = string;
export type LicenseId = string;
export type UserId = string;
export type UserEmail = string;
export type AuditLogId = string;

/**
 * Helper to validate that a value is a valid ID format
 */
export function isValidId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Type guard for StoreId
 */
export function isStoreId(value: unknown): value is StoreDomain {
  return isValidId(value);
}
