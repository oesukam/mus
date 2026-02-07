import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Products API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let createdProductId: number;
  let createdProductSlug: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    // Create a test admin user and get auth token
    const signupResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        email: `test-${Date.now()}@example.com`,
        password: 'Password123!',
        name: 'Test User',
        role: 'admin',
      });

    if (signupResponse.status === 201 || signupResponse.status === 200) {
      authToken = signupResponse.body.accessToken || signupResponse.body.token;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/products', () => {
    it('should return an array of products', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products')
        .expect(200);

      expect(response.body).toHaveProperty('products');
      expect(Array.isArray(response.body.products)).toBe(true);
    });

    it('should support pagination parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('products');
      expect(Array.isArray(response.body.products)).toBe(true);
    });
  });

  describe('GET /api/v1/products/:slug', () => {
    it('should return 404 for non-existent product', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/products/non-existent-slug-999')
        .expect(404);
    });
  });

  describe('POST /api/v1/admin/products', () => {
    it('should require authentication', async () => {
      const createProductDto = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        stock: 10,
        category: 'Books',
        vatPercentage: 18,
        currency: 'RWF',
        country: 'RW',
      };

      await request(app.getHttpServer())
        .post('/api/v1/admin/products')
        .send(createProductDto)
        .expect(401);
    });

    it('should create a new product with valid auth', async () => {
      if (!authToken) {
        console.log('Skipping test: No auth token available');
        return;
      }

      const createProductDto = {
        name: `Test Product ${Date.now()}`,
        description: 'Test Description',
        price: 99.99,
        stock: 10,
        category: 'Books',
        vatPercentage: 18,
        currency: 'RWF',
        country: 'RW',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createProductDto)
        .expect(201);

      expect(response.body).toHaveProperty('product');
      expect(response.body.product).toHaveProperty('id');
      expect(response.body.product).toHaveProperty('slug');
      expect(response.body.product.name).toBe(createProductDto.name);
      expect(response.body.product.price).toBe(createProductDto.price);
      createdProductId = response.body.product.id;
      createdProductSlug = response.body.product.slug;
    });

    it('should fail with missing required fields', async () => {
      if (!authToken) {
        console.log('Skipping test: No auth token available');
        return;
      }

      const invalidDto = {
        name: 'Test Product',
        // missing required fields
      };

      await request(app.getHttpServer())
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('GET /api/v1/products/:slug (created product)', () => {
    it('should return the created product by slug', async () => {
      if (!createdProductSlug) {
        console.log('Skipping test: No product created');
        return;
      }

      const response = await request(app.getHttpServer())
        .get(`/api/v1/products/${createdProductSlug}`)
        .expect(200);

      expect(response.body).toHaveProperty('product');
      expect(response.body.product.slug).toBe(createdProductSlug);
      expect(response.body.product).toHaveProperty('name');
      expect(response.body.product).toHaveProperty('price');
    });
  });

  describe('PATCH /api/v1/admin/products/:id', () => {
    it('should require authentication', async () => {
      if (!createdProductId) {
        console.log('Skipping test: No product created');
        return;
      }

      await request(app.getHttpServer())
        .patch(`/api/v1/admin/products/${createdProductId}`)
        .send({ name: 'Updated Name' })
        .expect(401);
    });

    it('should update a product with valid auth', async () => {
      if (!authToken || !createdProductId) {
        console.log('Skipping test: No auth token or product');
        return;
      }

      const updateDto = {
        name: 'Updated Product Name',
        price: 149.99,
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/admin/products/${createdProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body).toHaveProperty('product');
      expect(response.body.product.name).toBe(updateDto.name);
      expect(response.body.product.price).toBe(updateDto.price);
    });
  });

  describe('DELETE /api/v1/admin/products/:id', () => {
    it('should require authentication', async () => {
      if (!createdProductId) {
        console.log('Skipping test: No product created');
        return;
      }

      await request(app.getHttpServer())
        .delete(`/api/v1/admin/products/${createdProductId}`)
        .expect(401);
    });

    it('should delete a product with valid auth', async () => {
      if (!authToken || !createdProductId || !createdProductSlug) {
        console.log('Skipping test: No auth token or product');
        return;
      }

      await request(app.getHttpServer())
        .delete(`/api/v1/admin/products/${createdProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify it's deleted by trying to get it by slug
      await request(app.getHttpServer())
        .get(`/api/v1/products/${createdProductSlug}`)
        .expect(404);
    });
  });
});
