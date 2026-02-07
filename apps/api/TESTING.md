# API Testing Guide

## Overview

The API has both unit tests and end-to-end (e2e) tests to ensure code quality and functionality.

## Test Status

### Unit Tests
**Status**: ✅ All Passing (9/9)

### E2E Tests
**Status**: ⚠️ Partially Passing (7/11)

## Running Tests

### Unit Tests
```bash
# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:cov
```

### E2E Tests
```bash
# Run end-to-end tests
pnpm test:e2e
```

### All Tests
```bash
# Run both unit and e2e tests
pnpm test && pnpm test:e2e
```

## Test Files

### Unit Tests
- `src/modules/products/products.service.spec.ts` - Tests for ProductsService

### E2E Tests
- `test/products.e2e-spec.ts` - End-to-end tests for Products API

## Dependencies Fixed

The following test dependencies were configured correctly:

1. **uuid** - Downgraded to v9.0.0 (v13 is ESM-only and incompatible with Jest)
2. **supertest** - Downgraded to v6.3.0 (v7 is ESM-only)
3. **express** - Added explicitly as dependency
4. **@types/supertest** - Added for TypeScript support

## Test Configuration

### Jest Configuration (`jest.config.js`)
- TypeScript transformation via `ts-jest`
- Coverage collection excluding modules, entities, and DTOs
- Test environment: Node.js

### E2E Configuration (`test/jest-e2e.json`)
- Test timeout: 30 seconds
- Force exit enabled to prevent hanging
- Root directory: `test/`

## Known Test Issues

### E2E Test Failures

#### 1. GET /api/v1/products - Array Check Fails
**Issue**: API returns paginated response object, not a plain array
**Status**: Expected API behavior
**Fix Required**: Update test to handle paginated response:
```typescript
// Instead of
expect(Array.isArray(response.body)).toBe(true);

// Use
expect(response.body).toHaveProperty('data');
expect(Array.isArray(response.body.data)).toBe(true);
```

#### 2. POST /api/v1/products - 403 Forbidden
**Issue**: Creating products requires admin or seller role
**Status**: Expected API behavior (Role-based access control)
**Fix Required**: Create admin user in test setup:
```typescript
// In beforeAll, after creating regular user
const adminResponse = await request(app.getHttpServer())
  .post('/api/v1/auth/signup')
  .send({
    email: `admin-${Date.now()}@example.com`,
    password: 'Password123!',
    name: 'Admin User',
    role: 'admin', // or 'seller'
  });
```

## Test Best Practices

1. **Use Unique Test Data**: Tests create data with timestamps to avoid conflicts
2. **Clean Up**: Tests should clean up created data (currently handled)
3. **Authentication**: E2e tests handle JWT authentication properly
4. **Isolation**: Each test should be independent
5. **Descriptive Names**: Test names clearly describe what they test

## Writing New Tests

### Unit Test Template
```typescript
describe('ServiceName', () => {
  let service: ServiceName;
  let repository: Repository<Entity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceName,
        {
          provide: getRepositoryToken(Entity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ServiceName>(ServiceName);
    repository = module.get(getRepositoryToken(Entity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Add more tests
});
```

### E2E Test Template
```typescript
describe('Feature API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    // ... configure app
    await app.init();

    // Get auth token
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({ /* user data */ });
    authToken = response.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should test something', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/endpoint')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('someField');
  });
});
```

## Troubleshooting

### Tests Hang
**Problem**: Tests don't exit after completion
**Solution**: Ensure `forceExit: true` in jest-e2e.json and proper cleanup in `afterAll`

### Import Errors
**Problem**: `request is not a function`
**Solution**: Use `import request = require('supertest');` syntax for CommonJS compatibility

### Database Connection Errors
**Problem**: E2E tests can't connect to database
**Solution**: Ensure PostgreSQL is running (via Docker) and environment variables are set

### Authentication Failures
**Problem**: Tests get 401 Unauthorized
**Solution**: Verify JWT token is properly extracted and passed in Authorization header

## CI/CD Integration

For continuous integration, add to your CI pipeline:

```yaml
# Example GitHub Actions
- name: Run Tests
  run: |
    pnpm install
    pnpm test
    pnpm test:e2e
  env:
    DB_HOST: localhost
    DB_PORT: 5432
    DB_USERNAME: postgres
    DB_PASSWORD: postgres
    DB_NAME: test_db
    JWT_SECRET: test_secret
```

## Future Improvements

1. **Mock External Services**: Mock S3, Redis, email services in tests
2. **Test Database**: Use separate test database or in-memory database
3. **Factories**: Create test data factories for consistent test data
4. **Fixtures**: Load fixture data for complex test scenarios
5. **Snapshots**: Use Jest snapshots for API response testing
6. **Performance Tests**: Add performance benchmarks
7. **Load Tests**: Add load testing for critical endpoints
8. **Test Coverage Goals**: Aim for >80% coverage

## Resources

- [Jest Documentation](https://jestjs.io/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Supertest](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
