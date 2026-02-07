export const ERROR_CODES = {
  // Authentication & Authorization Errors
  UNAUTHORIZED: 'authentication_required',
  INVALID_CREDENTIALS: 'invalid_credentials',
  TOKEN_EXPIRED: 'token_expired',
  TOKEN_INVALID: 'invalid_token',
  INSUFFICIENT_PERMISSIONS: 'insufficient_permissions',
  ACCOUNT_SUSPENDED: 'account_suspended',
  ACCOUNT_INACTIVE: 'account_inactive',

  // Validation Errors
  VALIDATION_ERROR: 'validation_error',
  INVALID_INPUT: 'invalid_request_error',
  MISSING_REQUIRED_FIELD: 'parameter_missing',
  INVALID_PARAMETER: 'parameter_invalid_format',
  INVALID_EMAIL: 'email_invalid',
  INVALID_PASSWORD: 'password_invalid',
  INVALID_PHONE_NUMBER: 'phone_number_invalid',

  // Resource Not Found Errors
  RESOURCE_NOT_FOUND: 'resource_missing',
  PRODUCT_NOT_FOUND: 'product_not_found',
  USER_NOT_FOUND: 'user_not_found',
  ORDER_NOT_FOUND: 'order_not_found',
  TRANSACTION_NOT_FOUND: 'transaction_not_found',
  CONTACT_NOT_FOUND: 'contact_not_found',
  FILE_NOT_FOUND: 'file_not_found',

  // Conflict Errors
  RESOURCE_ALREADY_EXISTS: 'resource_already_exists',
  USER_ALREADY_EXISTS: 'user_already_exists',
  EMAIL_ALREADY_EXISTS: 'email_already_registered',
  DUPLICATE_ENTRY: 'duplicate_entry',

  // Rate Limiting Errors
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  TOO_MANY_REQUESTS: 'too_many_requests',

  // Server Errors
  INTERNAL_SERVER_ERROR: 'internal_server_error',
  DATABASE_ERROR: 'database_error',
  CACHE_ERROR: 'cache_error',
  EXTERNAL_SERVICE_ERROR: 'external_service_error',

  // Business Logic Errors
  INSUFFICIENT_STOCK: 'insufficient_stock',
  INVALID_OPERATION: 'invalid_operation',
  PAYMENT_FAILED: 'payment_failed',
  PAYMENT_PROCESSING: 'payment_processing',
  INSUFFICIENT_FUNDS: 'insufficient_funds',
  ORDER_ALREADY_PROCESSED: 'order_already_processed',
  ORDER_CANCELLED: 'order_cancelled',
  REFUND_FAILED: 'refund_failed',

  // File Upload Errors
  FILE_TOO_LARGE: 'file_too_large',
  INVALID_FILE_TYPE: 'invalid_file_type',
  UPLOAD_FAILED: 'upload_failed',

  // Email Errors
  EMAIL_SEND_FAILED: 'email_send_failed',
  EMAIL_TEMPLATE_ERROR: 'email_template_error',

  // Stock & Inventory Errors
  PRODUCT_OUT_OF_STOCK: 'product_out_of_stock',
  PRODUCT_DISCONTINUED: 'product_discontinued',
  PRODUCT_NOT_AVAILABLE: 'product_not_available_in_country',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
