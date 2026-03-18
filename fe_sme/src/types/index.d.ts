/**
 * Global ambient type declarations for the fe_sme application.
 * These types are available project-wide without explicit import.
 */

/** Standard API response envelope returned by the backend. */
declare interface ApiResponse<T = unknown> {
  data: T;
  message: string;
  success: boolean;
  errorCode: string | null;
}

/** Paginated API response envelope. */
declare interface PagedResponse<T = unknown> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Generic key-value option, commonly used by Select components. */
declare interface SelectOption<T = string> {
  label: string;
  value: T;
}

/** Shared ID type to clearly distinguish entity identifiers. */
declare type EntityId = string;

/** Alias for nullable values. */
declare type Nullable<T> = T | null;

/** Alias for optional-nullable values. */
declare type Maybe<T> = T | null | undefined;
