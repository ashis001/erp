import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { faker } from '@faker-js/faker';

export async function POST() {
  try {
    const connection = await pool.getConnection();

    // Clear existing data in reverse order of dependency
    await connection.query('DELETE FROM `audit_logs`');
    await connection.query('DELETE FROM `sales`');
    await connection.query('DELETE FROM `assignments`');
    await connection.query('DELETE FROM `inventory_lots`');
    await connection.query('DELETE FROM `items`');
    await connection.query('DELETE FROM `categories`');
    await connection.query('DELETE FROM `users`');

    // Seed Users
    const userRoles = ['superadmin', 'book_admin', 'counter_admin', 'japa_admin'];
    const userValues = Array.from({ length: 10 }, () => [
      faker.person.fullName(),
      faker.internet.email(),
      faker.helpers.arrayElement(userRoles),
      faker.datatype.boolean(),
    ]);
    // Ensure at least one superadmin
    userValues.push(['Super Admin', 'superadmin@example.com', 'superadmin', true]);
    await connection.query('INSERT INTO `users` (`name`, `email`, `role`, `is_active`) VALUES ?', [userValues]);
    const [users] = await connection.query('SELECT id, role FROM `users`');
    const userIds = (users as any[]).map(u => u.id);
    const adminUserIds = (users as any[]).filter(u => u.role !== 'user').map(u => u.id);

    // Seed Categories
    const categoryValues = Array.from({ length: 5 }, () => [
      faker.commerce.department(),
      faker.lorem.sentence(),
    ]);
    await connection.query('INSERT INTO `categories` (`name`, `description`) VALUES ?', [categoryValues]);
    const [categories] = await connection.query('SELECT id FROM `categories`');
    const categoryIds = (categories as any[]).map(c => c.id);

    // Seed Items
    const itemValues = Array.from({ length: 50 }, () => [
      faker.helpers.arrayElement(categoryIds),
      faker.commerce.productName(),
      faker.string.alphanumeric(10).toUpperCase(),
      faker.commerce.price({ min: 10, max: 1000, dec: 2 }),
    ]);
    await connection.query('INSERT INTO `items` (`category_id`, `name`, `sku`, `default_selling_price`) VALUES ?', [itemValues]);
    const [items] = await connection.query('SELECT id FROM `items`');
    const itemIds = (items as any[]).map(i => i.id);

    // Seed Inventory Lots
    const lotValues = Array.from({ length: 100 }, () => {
        const cost_price = parseFloat(faker.commerce.price({ min: 5, max: 800, dec: 2 }));
        return [
            faker.helpers.arrayElement(itemIds),
            faker.number.int({ min: 10, max: 200 }),
            cost_price,
            cost_price * 1.25, // 25% markup for selling price
        ];
    });
    await connection.query('INSERT INTO `inventory_lots` (`item_id`, `qty_purchased`, `cost_price`, `selling_price`) VALUES ?', [lotValues]);
    const [lots] = await connection.query('SELECT id FROM `inventory_lots`');
    const lotIds = (lots as any[]).map(l => l.id);

    // Seed Assignments
    const assignmentValues = Array.from({ length: 30 }, () => [
        faker.helpers.arrayElement(itemIds),
        faker.helpers.arrayElement(adminUserIds),
        faker.number.int({ min: 1, max: 10 }),
        faker.helpers.arrayElement(lotIds),
    ]);
    await connection.query('INSERT INTO `assignments` (`item_id`, `admin_user_id`, `qty_assigned`, `source_lot_id`) VALUES ?', [assignmentValues]);

    // Seed Sales
    const salesValues = Array.from({ length: 200 }, () => {
        const qty_sold = faker.number.int({ min: 1, max: 5 });
        const unit_price = parseFloat(faker.commerce.price({ min: 10, max: 1000, dec: 2 }));
        return [
            faker.helpers.arrayElement(itemIds),
            faker.helpers.arrayElement(adminUserIds),
            qty_sold,
            unit_price,
            qty_sold * unit_price,
            faker.person.fullName(),
            faker.location.streetAddress(),
            faker.phone.number(),
        ];
    });
    await connection.query('INSERT INTO `sales` (`item_id`, `admin_user_id`, `qty_sold`, `unit_price`, `total_price`, `customer_name`, `customer_address`, `customer_phone`) VALUES ?', [salesValues]);

    // Seed Audit Logs
    const actions = ['CREATE', 'UPDATE', 'DELETE', 'ASSIGN', 'SELL'];
    const entityTypes = ['users', 'categories', 'items', 'inventory_lots', 'sales', 'assignments'];
    const auditValues = Array.from({ length: 300 }, () => [
        faker.helpers.arrayElement(userIds),
        faker.helpers.arrayElement(actions),
        faker.helpers.arrayElement(entityTypes),
        faker.number.int({ min: 1, max: 50 }),
    ]);
    await connection.query('INSERT INTO `audit_logs` (`user_id`, `action`, `entity_type`, `entity_id`) VALUES ?', [auditValues]);

    connection.release();

    return NextResponse.json({ success: true, message: 'Database seeded successfully' });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ success: false, error: err.message, stack: err.stack }, { status: 500 });
  }
}
