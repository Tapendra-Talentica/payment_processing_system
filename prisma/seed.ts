import { PrismaClient, UserRole, OrderStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@payment-system.com' },
    update: {},
    create: {
      email: 'admin@payment-system.com',
      password: hashedPassword,
      name: 'System Administrator',
      role: UserRole.ADMIN,
    },
  });

  console.log('✓ Admin user created:', adminUser.email);

  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      password: await bcrypt.hash('Customer@123', 10),
      name: 'John Doe',
      role: UserRole.CUSTOMER,
    },
  });

  console.log('✓ Customer user created:', customerUser.email);

  const customer1 = await prisma.customer.create({
    data: {
      email: 'john.doe@example.com',
      name: 'John Doe',
      billingAddress: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
      },
    },
  });

  console.log('✓ Customer 1 created:', customer1.name);

  const customer2 = await prisma.customer.create({
    data: {
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
      billingAddress: {
        street: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90001',
        country: 'USA',
      },
    },
  });

  console.log('✓ Customer 2 created:', customer2.name);

  const order1 = await prisma.order.create({
    data: {
      customerId: customer1.id,
      userId: customerUser.id,
      amount: 99.99,
      currency: 'USD',
      status: OrderStatus.PENDING,
      metadata: {
        description: 'Sample order for testing',
        items: [
          { name: 'Product A', quantity: 1, price: 49.99 },
          { name: 'Product B', quantity: 1, price: 50.0 },
        ],
      },
    },
  });

  console.log('✓ Order 1 created:', order1.id);

  const order2 = await prisma.order.create({
    data: {
      customerId: customer2.id,
      userId: customerUser.id,
      amount: 149.99,
      currency: 'USD',
      status: OrderStatus.PENDING,
      metadata: {
        description: 'Another sample order',
        items: [{ name: 'Product C', quantity: 2, price: 74.995 }],
      },
    },
  });

  console.log('✓ Order 2 created:', order2.id);

  const order3 = await prisma.order.create({
    data: {
      customerId: customer1.id,
      amount: 49.99,
      currency: 'USD',
      status: OrderStatus.PENDING,
      metadata: {
        description: 'Guest order example',
        items: [{ name: 'Product D', quantity: 1, price: 49.99 }],
      },
    },
  });

  console.log('✓ Order 3 created (guest order):', order3.id);

  console.log('\n==============================================');
  console.log('Database seeding completed successfully!');
  console.log('==============================================');
  console.log('\nTest Credentials:');
  console.log('Admin: admin@payment-system.com / Admin@123');
  console.log('Customer: customer@example.com / Customer@123');
  console.log('==============================================\n');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
