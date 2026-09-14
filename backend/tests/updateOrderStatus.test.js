import 'dotenv/config';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import resolvers from '../src/graphql/resolvers.js';

const { updateOrderStatus } = resolvers.Mutation;

function makeContext(overrides = {}) {
  const toMock = vi.fn(() => ({ emit: vi.fn() }));
  return {
    userId: 'admin-1',
    role: 'ADMIN',
    prisma: {
      order: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    },
    io: {
      emit: vi.fn(),
      to: toMock,
    },
    ...overrides,
  };
}

describe('updateOrderStatus', () => {
  let context;

  beforeEach(() => {
    context = makeContext();
  });

  it('throws if the user is not logged in', async () => {
    context.userId = null;
    await expect(
      updateOrderStatus(null, { orderId: 'order-1', status: 'PREPARING' }, context)
    ).rejects.toThrow('You must be logged in');
  });

  it('throws if the user is not an admin', async () => {
    context.role = 'CUSTOMER';
    await expect(
      updateOrderStatus(null, { orderId: 'order-1', status: 'PREPARING' }, context)
    ).rejects.toThrow('Only admins can update order status');
  });

  it('throws if the order does not exist', async () => {
    context.prisma.order.findUnique.mockResolvedValue(null);
    await expect(
      updateOrderStatus(null, { orderId: 'missing-order', status: 'PREPARING' }, context)
    ).rejects.toThrow('Order not found');
  });

  it('updates the order status and records status history', async () => {
    context.prisma.order.findUnique.mockResolvedValue({ id: 'order-1', status: 'PENDING' });

    let updateArgs;
    context.prisma.order.update.mockImplementation((args) => {
      updateArgs = args;
      return Promise.resolve({ id: 'order-1', status: args.data.status });
    });

    const result = await updateOrderStatus(
      null,
      { orderId: 'order-1', status: 'PREPARING' },
      context
    );

    expect(updateArgs.where).toEqual({ id: 'order-1' });
    expect(updateArgs.data.status).toBe('PREPARING');
    expect(updateArgs.data.statusHistory.create).toEqual({ status: 'PREPARING' });
    expect(result.status).toBe('PREPARING');
  });

  it('emits an orderStatusUpdated event to the correct order room', async () => {
    context.prisma.order.findUnique.mockResolvedValue({ id: 'order-1', status: 'PENDING' });
    context.prisma.order.update.mockResolvedValue({ id: 'order-1', status: 'READY' });

    await updateOrderStatus(null, { orderId: 'order-1', status: 'READY' }, context);

    expect(context.io.to).toHaveBeenCalledWith('order:order-1');
  });
});