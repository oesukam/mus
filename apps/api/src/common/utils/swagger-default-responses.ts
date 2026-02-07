import { OpenAPIObject } from '@nestjs/swagger';

export const swaggerDefaultErrorResponsesPlugin = (document: OpenAPIObject) => {
  for (const path of Object.keys(document.paths)) {
    for (const method of Object.keys(document.paths[path])) {
      const operation = document.paths[path][method];

      operation.responses = {
        '400': { $ref: '#/components/responses/BadRequest' },
        '401': { $ref: '#/components/responses/Unauthorized' },
        '403': { $ref: '#/components/responses/Forbidden' },
        '404': { $ref: '#/components/responses/NotFound' },
        '409': { $ref: '#/components/responses/Conflict' },
        '500': { $ref: '#/components/responses/InternalServerError' },
        default: { $ref: '#/components/responses/InternalServerError' },
        ...(operation.responses || {}),
      };
    }
  }

  return document;
};
