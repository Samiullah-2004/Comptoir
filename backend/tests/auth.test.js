import 'dotenv/config';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import resolvers from '../src/graphql/resolvers.js';

const { register, login } = resolvers.Mutation;

function makeContext(overrides = {}) {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    },
    ...overrides,
  };
}

describe('register', () => {
  let context;

  beforeEach(() => {
    context = makeContext();
  });

  it('throws if the email is already in use', async () => {
    context.prisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

    await expect(
      register(
        null,
        { name: 'Sami', email: 'taken@example.com', password: 'password123' },
        context
      )
    ).rejects.toThrow('Email already in use');
  });

  it('hashes the password before storing it (never stores plain text)', async () => {
    context.prisma.user.findUnique.mockResolvedValue(null);

    let createdData;
    context.prisma.user.create.mockImplementation(({ data }) => {
      createdData = data;
      return Promise.resolve({ id: 'user-1', ...data, role: 'CUSTOMER' });
    });

    await register(
      null,
      { name: 'Sami', email: 'new@example.com', password: 'password123' },
      context
    );

    expect(createdData.passwordHash).toBeDefined();
    expect(createdData.passwordHash).not.toBe('password123');

    const matches = await bcrypt.compare('password123', createdData.passwordHash);
    expect(matches).toBe(true);
  });

  it('returns a token and the created user on success', async () => {
    context.prisma.user.findUnique.mockResolvedValue(null);
    context.prisma.user.create.mockResolvedValue({
      id: 'user-1',
      name: 'Sami',
      email: 'new@example.com',
      role: 'CUSTOMER',
    });

    const result = await register(
      null,
      { name: 'Sami', email: 'new@example.com', password: 'password123' },
      context
    );

    expect(result.token).toBeDefined();
    expect(result.user.email).toBe('new@example.com');
  });
});

describe('login', () => {
  let context;

  beforeEach(() => {
    context = makeContext();
  });

  it('throws if no user exists with that email', async () => {
    context.prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      login(null, { email: 'nobody@example.com', password: 'password123' }, context)
    ).rejects.toThrow('Invalid email or password');
  });

  it('throws if the password does not match', async () => {
    const realHash = await bcrypt.hash('correct-password', 10);
    context.prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      passwordHash: realHash,
    });

    await expect(
      login(null, { email: 'user@example.com', password: 'wrong-password' }, context)
    ).rejects.toThrow('Invalid email or password');
  });

  it('returns a token when the password matches', async () => {
    const realHash = await bcrypt.hash('correct-password', 10);
    context.prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      passwordHash: realHash,
      role: 'CUSTOMER',
    });

    const result = await login(
      null,
      { email: 'user@example.com', password: 'correct-password' },
      context
    );

    expect(result.token).toBeDefined();
    expect(result.user.email).toBe('user@example.com');
  });
});