import 'dotenv/config';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import resolvers from '../src/graphql/resolvers.js';

const { createOrder } = resolvers.Mutation;

function makeContext(overrides = {}) {
  return {
    userId: 'user-1',
    role: 'CUSTOMER',
    prisma: {
      menuItem: {
        findMany: vi.fn(),
      },
      order: {
        create: vi.fn(),
      },
    },
    io: {
      emit: vi.fn(),
      to: vi.fn(() => ({ emit: vi.fn() })),
    },
    ...overrides,
  };
}

describe('createOrder', () => {
  let context;

  beforeEach(() => {
    context = makeContext();
  });

  it('throws if the user is not logged in', async () => {
    context.userId = null;
    await expect(
      createOrder(null, { items: [{ menuItemId: 'a', quantity: 1 }] }, context)
    ).rejects.toThrow('You must be logged in to place an order');
  });

  it('throws if items array is empty', async () => {
    await expect(createOrder(null, { items: [] }, context)).rejects.toThrow(
      'Order must contain at least one item'
    );
  });

  it('throws if a menu item is not found', async () => {
    context.prisma.menuItem.findMany.mockResolvedValue([]); // none found
    await expect(
      createOrder(null, { items: [{ menuItemId: 'missing-id', quantity: 1 }] }, context)
    ).rejects.toThrow('One or more menu items not found');
  });

  it('throws if a menu item is unavailable', async () => {
    context.prisma.menuItem.findMany.mockResolvedValue([
      { id: 'item-1', name: 'Zinger Burger', price: 650, available: false },
    ]);
    await expect(
      createOrder(null, { items: [{ menuItemId: 'item-1', quantity: 1 }] }, context)
    ).rejects.toThrow('Zinger Burger is not currently available');
  });

  it('correctly calculates the total across multiple items and quantities', async () => {
    context.prisma.menuItem.findMany.mockResolvedValue([
      { id: 'item-1', name: 'Zinger Burger', price: 650, available: true },
      { id: 'item-2', name: 'Fries', price: 350, available: true },
    ]);

    let createdData;
    context.prisma.order.create.mockImplementation(({ data }) => {
      createdData = data;
      return Promise.resolve({ id: 'order-1', ...data });
    });

    await createOrder(
      null,
      {
        items: [
          { menuItemId: 'item-1', quantity: 2 }, // 650 * 2 = 1300
          { menuItemId: 'item-2', quantity: 3 }, // 350 * 3 = 1050
        ],
      },
      context
    );

    // 1300 + 1050 = 2350
    expect(createdData.total).toBe(2350);
    expect(createdData.status).toBe('PENDING');
  });

  it('emits a newOrder socket event after successful creation', async () => {
    context.prisma.menuItem.findMany.mockResolvedValue([
      { id: 'item-1', name: 'Fries', price: 350, available: true },
    ]);
    context.prisma.order.create.mockResolvedValue({ id: 'order-99' });

    await createOrder(null, { items: [{ menuItemId: 'item-1', quantity: 1 }] }, context);

    expect(context.io.emit).toHaveBeenCalledWith('newOrder', { orderId: 'order-99' });
  });
});