export const SwaggerResponseComponents = {
  BadRequest: {
    description: 'Bad Request – invalid parameters or payload',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 400 },
            message: { type: 'string', example: 'Invalid input data' },
            error: { type: 'string', example: 'Bad Request' },
            errorCode: {
              type: 'string',
              example: 'request_payload_wrong_format',
            },
          },
        },
      },
    },
  },
  Unauthorized: {
    description: 'Unauthorized – missing or invalid token',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 401 },
            message: { type: 'string', example: 'Unauthorized' },
            error: { type: 'string', example: 'Unauthorized' },
          },
        },
      },
    },
  },
  Forbidden: {
    description: 'Forbidden – insufficient permissions',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 403 },
            message: { type: 'string', example: 'Forbidden access' },
            error: { type: 'string', example: 'Forbidden' },
          },
        },
      },
    },
  },
  NotFound: {
    description: 'Not Found – resource not found',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 404 },
            message: { type: 'string', example: 'Resource not found' },
            error: { type: 'string', example: 'Not Found' },
          },
        },
      },
    },
  },
  Conflict: {
    description: 'Conflict – resource already exists or state conflict',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 409 },
            message: { type: 'string', example: 'Resource already exists' },
            error: { type: 'string', example: 'Conflict' },
          },
        },
      },
    },
  },
  InternalServerError: {
    description: 'Internal Server Error – unexpected failure',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 500 },
            message: { type: 'string', example: 'Something went wrong' },
            error: { type: 'string', example: 'Internal Server Error' },
          },
        },
      },
    },
  },
};
