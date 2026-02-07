# API Error Codes

This document describes all error codes that may be returned by the API. Error codes follow a descriptive naming convention similar to Stripe's API, making them self-documenting and easier to understand.

## Error Response Format

All error responses include an `errorCode` field in addition to the standard HTTP status code:

```json
{
  "message": "Invalid email format",
  "errorCode": "email_invalid",
  "timestamp": "2024-11-04T12:00:00.000Z"
}
```

For validation errors with multiple issues:

```json
{
  "message": ["Email is required", "Password must be at least 8 characters"],
  "errorCode": "validation_error",
  "timestamp": "2024-11-04T12:00:00.000Z",
  "errors": ["Email is required", "Password must be at least 8 characters"]
}
```

## Authentication & Authorization Errors

These errors occur when there are issues with user authentication or authorization.

| Error Code | HTTP Status | Description | Resolution |
|------------|-------------|-------------|------------|
| `authentication_required` | 401 | User must be authenticated to access this resource | Provide valid authentication credentials |
| `invalid_credentials` | 401 | The provided email/password combination is incorrect | Check credentials and try again |
| `token_expired` | 401 | The authentication token has expired | Refresh the token or login again |
| `invalid_token` | 401 | The authentication token is malformed or invalid | Provide a valid authentication token |
| `insufficient_permissions` | 403 | User lacks the required permissions | Contact an administrator for access |
| `account_suspended` | 403 | The user account has been suspended | Contact support |
| `account_inactive` | 403 | The user account is not active | Verify your email or contact support |

## Validation Errors

These errors occur when request data fails validation.

| Error Code | HTTP Status | Description | Resolution |
|------------|-------------|-------------|------------|
| `validation_error` | 400 | General validation error | Check the error message for specific validation issues |
| `invalid_request_error` | 400 | The request contains invalid data | Review request parameters and format |
| `parameter_missing` | 400 | A required parameter is missing | Include all required parameters |
| `parameter_invalid_format` | 400 | A parameter has an invalid format | Check parameter format requirements |
| `email_invalid` | 400 | The email address format is invalid | Provide a valid email address |
| `password_invalid` | 400 | Password doesn't meet requirements | Review password requirements |
| `phone_number_invalid` | 400 | Phone number format is invalid | Provide a valid phone number |

## Resource Not Found Errors

These errors occur when a requested resource doesn't exist.

| Error Code | HTTP Status | Description | Resolution |
|------------|-------------|-------------|------------|
| `resource_missing` | 404 | The requested resource was not found | Verify the resource ID or path |
| `product_not_found` | 404 | The specified product doesn't exist | Check the product ID |
| `user_not_found` | 404 | The specified user doesn't exist | Verify the user ID |
| `order_not_found` | 404 | The specified order doesn't exist | Check the order ID |
| `transaction_not_found` | 404 | The specified transaction doesn't exist | Verify the transaction ID |
| `contact_not_found` | 404 | The specified contact message doesn't exist | Check the contact ID |
| `file_not_found` | 404 | The specified file doesn't exist | Verify the file ID or URL |

## Conflict Errors

These errors occur when there's a conflict with existing data.

| Error Code | HTTP Status | Description | Resolution |
|------------|-------------|-------------|------------|
| `resource_already_exists` | 409 | A resource with this identifier already exists | Use a different identifier or update the existing resource |
| `user_already_exists` | 409 | A user with this identifier already exists | Login with existing account or use different credentials |
| `email_already_registered` | 409 | This email is already registered | Use a different email or login with existing account |
| `duplicate_entry` | 409 | This entry already exists in the system | Update existing entry or use different data |

## Rate Limiting Errors

These errors occur when rate limits are exceeded.

| Error Code | HTTP Status | Description | Resolution |
|------------|-------------|-------------|------------|
| `rate_limit_exceeded` | 429 | API rate limit has been exceeded | Wait before making more requests (check retry headers) |
| `too_many_requests` | 429 | Too many requests in a short time period | Slow down request frequency |

## Server Errors

These errors indicate problems on the server side.

| Error Code | HTTP Status | Description | Resolution |
|------------|-------------|-------------|------------|
| `internal_server_error` | 500 | An unexpected server error occurred | Retry the request, contact support if it persists |
| `database_error` | 500 | Database operation failed | Retry the request, contact support if it persists |
| `cache_error` | 500 | Cache operation failed | Retry the request |
| `external_service_error` | 502 | External service (S3, email, etc.) failed | Retry the request |

## Business Logic Errors

These errors occur due to business rule violations.

| Error Code | HTTP Status | Description | Resolution |
|------------|-------------|-------------|------------|
| `insufficient_stock` | 400 | Not enough stock available for this product | Reduce quantity or choose a different product |
| `invalid_operation` | 400 | This operation is not allowed in the current state | Review the operation requirements |
| `payment_failed` | 402 | Payment processing failed | Check payment details and try again |
| `payment_processing` | 402 | Payment is still being processed | Wait for payment completion |
| `insufficient_funds` | 402 | Insufficient funds for this transaction | Add funds or use a different payment method |
| `order_already_processed` | 400 | This order has already been processed | Create a new order if needed |
| `order_cancelled` | 400 | This order has been cancelled | Create a new order |
| `refund_failed` | 400 | Refund processing failed | Contact support |

## File Upload Errors

These errors occur during file upload operations.

| Error Code | HTTP Status | Description | Resolution |
|------------|-------------|-------------|------------|
| `file_too_large` | 400 | File size exceeds the maximum allowed | Reduce file size or compress the file |
| `invalid_file_type` | 400 | File type is not allowed | Use an allowed file type (JPEG, PNG, PDF, etc.) |
| `upload_failed` | 500 | File upload failed | Retry the upload |

## Email Errors

These errors occur during email operations.

| Error Code | HTTP Status | Description | Resolution |
|------------|-------------|-------------|------------|
| `email_send_failed` | 500 | Email sending failed | Retry or contact support |
| `email_template_error` | 500 | Email template processing failed | Contact support |

## Stock & Inventory Errors

These errors relate to product availability.

| Error Code | HTTP Status | Description | Resolution |
|------------|-------------|-------------|------------|
| `product_out_of_stock` | 400 | Product is currently out of stock | Check back later or choose a different product |
| `product_discontinued` | 400 | Product has been discontinued | Choose a different product |
| `product_not_available_in_country` | 400 | Product is not available in the selected country | Select a different country or product |

## Error Handling Best Practices

### For API Consumers

1. **Always check the `errorCode` field** in addition to HTTP status codes for precise error handling
2. **Display user-friendly messages** based on error codes
3. **Log errors** with full context for debugging
4. **Implement retry logic** for transient errors (500-level errors)
5. **Handle rate limits gracefully** by respecting retry headers

### Example Error Handling (JavaScript/TypeScript)

```typescript
try {
  const response = await fetch('/api/v1/products', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();

    switch (error.errorCode) {
      case 'authentication_required':
      case 'token_expired':
        // Redirect to login
        redirectToLogin();
        break;

      case 'insufficient_permissions':
        // Show access denied message
        showError('You do not have permission to access this resource');
        break;

      case 'rate_limit_exceeded':
        // Implement exponential backoff
        await delay(retryAfter);
        return retryRequest();

      case 'product_not_found':
        showError('The product you are looking for does not exist');
        break;

      default:
        showError('An unexpected error occurred. Please try again.');
    }
  }
} catch (error) {
  console.error('Request failed:', error);
}
```

### Custom Error Responses

You can throw custom errors with specific error codes in your controllers:

```typescript
import { HttpException, HttpStatus } from '@nestjs/common';
import { ERROR_CODES } from '../common/constants/error-codes';

// Example: Product not found
throw new HttpException(
  {
    message: 'Product with ID 123 not found',
    errorCode: ERROR_CODES.PRODUCT_NOT_FOUND,
  },
  HttpStatus.NOT_FOUND
);

// Example: Insufficient stock
throw new HttpException(
  {
    message: 'Only 5 units available, but 10 requested',
    errorCode: ERROR_CODES.INSUFFICIENT_STOCK,
  },
  HttpStatus.BAD_REQUEST
);
```

## Error Code Versioning

Error codes are part of the API contract and follow these rules:

1. **Existing error codes will never be removed** to maintain backward compatibility
2. **New error codes may be added** as new features are developed
3. **Error code meanings will not change** once established
4. **Deprecated error codes** will be documented for at least 6 months before removal

## Support

If you encounter an error code not documented here or need clarification:

1. Check the API logs for additional context
2. Review the full error message for specific details
3. Contact support with the error code, timestamp, and request details
