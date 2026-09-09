import 'dotenv/config';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const prisma = {
  user: { findUnique: vi.fn(), create: vi.fn() },
  category: { findMany: vi.fn() },
};

let app;

beforeAll(async () => {
  const built = await createApp({ prismaClient: prisma });
  app = built.app;
});

describe('GraphQL endpoint (integration)', () => {
  it('runs the categories query publicly, with no auth required', async () => {
    prisma.category.findMany.mockResolvedValue([
      { id: 'cat-1', name: 'Burgers', menuItems: [] },
    ]);

    const res = await request(app)
      .post('/graphql')
      .send({ query: '{ categories { id name } }' });

    expect(res.status).toBe(200);
    expect(res.body.data.categories).toEqual([{ id: 'cat-1', name: 'Burgers' }]);
  });

  it('returns null for "me" when no auth token is provided', async () => {
    const res = await request(app)
      .post('/graphql')
      .send({ query: '{ me { id email } }' });

    expect(res.status).toBe(200);
    expect(res.body.data.me).toBeNull();
  });

  it('registers a new user end-to-end through the real HTTP layer', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'user-1',
      name: 'Sami',
      email: 'sami@example.com',
      role: 'CUSTOMER',
    });

    const mutation = `
      mutation {
        register(name: "Sami", email: "sami@example.com", password: "password123") {
          token
          user { id email }
        }
      }
    `;

    const res = await request(app).post('/graphql').send({ query: mutation });

    expect(res.status).toBe(200);
    expect(res.body.data.register.token).toBeDefined();
    expect(res.body.data.register.user.email).toBe('sami@example.com');
  });

  it('rejects createOrder with a GraphQL error when not authenticated', async () => {
    const mutation = `
      mutation {
        createOrder(items: [{ menuItemId: "x", quantity: 1 }]) {
          id
        }
      }
    `;

    const res = await request(app).post('/graphql').send({ query: mutation });

    expect(res.status).toBe(200);
    expect(res.body.errors[0].message).toBe('You must be logged in to place an order');
  });
});