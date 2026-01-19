/**
 * Storage URL resolver function type
 * Used for resolving storage object keys to full URLs
 */
export type StorageUrlResolver = (path: string) => string | undefined;
