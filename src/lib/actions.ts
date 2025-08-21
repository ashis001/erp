"use server";

import { suggestOptimalSellingPrice } from "@/ai/flows/suggest-optimal-price";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import bcrypt from 'bcryptjs';
import {
  addUser as dbAddUser,
  addInventoryLot as dbAddInventoryLot,
  addAssignment as dbAddAssignment,
  addSale as dbAddSale,
  addLog,
  addItem as dbAddItem,
  addCategory as dbAddCategory,
  addLead as dbAddLead,
  getUsers as dbGetUsers,
  getCategories as dbGetCategories,
  getItems as dbGetItems,
  getInventoryLots as dbGetInventoryLots,
  getAssignments as dbGetAssignments,
  getUserById as dbGetUserById,
  getSales as dbGetSales,
  getAuditLogs as dbGetAuditLogs,
  getLeads as dbGetLeads,
} from "./data";
import type { AuditLog, Assignment, User, Item } from "./types";
import pool from "./db";

export async function getUserById(id: number) {
  return await dbGetUserById(id);
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function loginUser(formData: FormData) {
  try {
    const validatedFields = loginSchema.safeParse(
      Object.fromEntries(formData.entries())
    );

    if (!validatedFields.success) {
      return { error: "Invalid email or password." };
    }

    const { email, password } = validatedFields.data;
    const users = await dbGetUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      return { error: "No user found with this email." };
    }

    if (!user.password) {
      return { error: "User has no password set." };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return { error: "Invalid password." };
    }

    return { success: true, user };

  } catch (error) {
    console.error(error);
    return { error: 'An unexpected error occurred.' };
  }
}

async function logAction(userId: number, action: AuditLog['action'], entity_type: string, entity_id: number, connection?: any) {
    try {
        console.log('Attempting to log action:', { userId, action, entity_type, entity_id });
        const result = await addLog({
            user_id: userId,
            action,
            entity_type,
            entity_id,
        }, connection);
        console.log('Log action successful:', result);
        revalidatePath('/dashboard/audit-logs');
    } catch (error) {
        console.error('Failed to log action:', error);
        // Don't throw error to prevent it from breaking the main operation
        // The main operation (like password reset) should succeed even if logging fails
    }
}

// Credit Sale Schema
const creditSaleSchema = z.object({
  itemId: z.string(),
  adminId: z.string(),
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(1, "Customer phone is required"),
  totalPrice: z.string(),
  downPayment: z.string(),
  paymentType: z.enum(['emi', 'pay_later']),
  emiPeriods: z.string(),
  payLaterDate: z.string().optional(),
  pendingBalance: z.string(),
  monthlyEmi: z.string(),
});

export async function recordCreditSale(formData: FormData) {
  let connection;
  try {
    const validatedFields = creditSaleSchema.safeParse(
      Object.fromEntries(formData.entries())
    );

    if (!validatedFields.success) {
      return { error: "Invalid form data." };
    }

    const {
      itemId,
      adminId,
      customerName,
      customerEmail,
      customerPhone,
      totalPrice,
      downPayment,
      paymentType,
      emiPeriods,
      payLaterDate,
      pendingBalance,
      monthlyEmi,
    } = validatedFields.data;

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check if admin has available stock
    const [adminAssignments, adminSales, items] = await Promise.all([
      dbGetAssignments(),
      dbGetSales(),
      dbGetItems(),
    ]);

    const totalAssignedToAdmin = adminAssignments
      .filter(a => a.admin_user_id === parseInt(adminId) && a.item_id === parseInt(itemId))
      .reduce((sum, a) => sum + a.qty_assigned, 0);
    
    const totalSoldByAdmin = adminSales
      .filter(s => s.admin_user_id === parseInt(adminId) && s.item_id === parseInt(itemId))
      .reduce((sum, s) => sum + s.qty_sold, 0);

    const adminAvailable = totalAssignedToAdmin - totalSoldByAdmin;

    if (adminAvailable <= 0) {
      return { error: "No available stock for this item." };
    }

    // Create credit_sales table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS credit_sales (
        id INT AUTO_INCREMENT PRIMARY KEY,
        item_id INT NOT NULL,
        admin_id INT NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        down_payment DECIMAL(10, 2) NOT NULL,
        payment_type ENUM('emi', 'pay_later') DEFAULT 'emi',
        emi_periods INT NOT NULL,
        pay_later_date DATE NULL,
        pending_balance DECIMAL(10, 2) NOT NULL,
        monthly_emi DECIMAL(10, 2) NOT NULL,
        status ENUM('active', 'completed', 'defaulted') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES items(id),
        FOREIGN KEY (admin_id) REFERENCES users(id)
      )
    `);

    // Create credit_payments table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS credit_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        credit_sale_id INT NOT NULL,
        payment_number INT NOT NULL,
        due_date DATE NOT NULL,
        amount_due DECIMAL(10, 2) NOT NULL,
        amount_paid DECIMAL(10, 2) DEFAULT 0,
        payment_date TIMESTAMP NULL,
        status ENUM('pending', 'paid', 'overdue') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (credit_sale_id) REFERENCES credit_sales(id)
      )
    `);

    // Calculate pay later date if needed
    let payLaterDateFormatted = null;
    if (paymentType === 'pay_later' && payLaterDate) {
      if (payLaterDate === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        payLaterDateFormatted = tomorrow.toISOString().split('T')[0];
      } else if (payLaterDate === '1_month') {
        const oneMonth = new Date();
        oneMonth.setMonth(oneMonth.getMonth() + 1);
        payLaterDateFormatted = oneMonth.toISOString().split('T')[0];
      } else if (payLaterDate.startsWith('20')) {
        payLaterDateFormatted = payLaterDate;
      }
    }

    // Insert credit sale record
    const [creditResult] = await connection.query(
      `INSERT INTO credit_sales (
        item_id, admin_id, customer_name, customer_email, customer_phone, 
        total_price, down_payment, payment_type, emi_periods, pay_later_date,
        pending_balance, monthly_emi
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        parseInt(itemId),
        parseInt(adminId),
        customerName,
        customerEmail,
        customerPhone,
        parseFloat(totalPrice),
        parseFloat(downPayment),
        paymentType,
        parseInt(emiPeriods),
        payLaterDateFormatted,
        parseFloat(pendingBalance),
        parseFloat(monthlyEmi),
      ]
    );

    const creditSaleId = (creditResult as any).insertId;

    // Generate payment schedule
    if (paymentType === 'emi') {
      // Generate EMI schedule
      const currentDate = new Date();
      for (let i = 1; i <= parseInt(emiPeriods); i++) {
        const dueDate = new Date(currentDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        
        await connection.query(
          `INSERT INTO credit_payments (
            credit_sale_id, payment_number, due_date, amount_due
          ) VALUES (?, ?, ?, ?)`,
          [creditSaleId, i, dueDate.toISOString().split('T')[0], parseFloat(monthlyEmi)]
        );
      }
    } else if (paymentType === 'pay_later' && payLaterDateFormatted) {
      // Generate single payment for pay later
      await connection.query(
        `INSERT INTO credit_payments (
          credit_sale_id, payment_number, due_date, amount_due
        ) VALUES (?, ?, ?, ?)`,
        [creditSaleId, 1, payLaterDateFormatted, parseFloat(monthlyEmi)]
      );
    }

    // Record the sale in the main sales table to track sold quantities
    await connection.query(
      `INSERT INTO sales (
        item_id, admin_user_id, qty_sold, unit_price, total_price, 
        customer_name, customer_address, customer_phone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        parseInt(itemId),
        parseInt(adminId),
        1, // Credit sales are always quantity 1
        parseFloat(totalPrice),
        parseFloat(totalPrice),
        customerName,
        null, // customer_address is null for credit sales
        customerPhone
      ]
    );

    // Log the action
    const actionType = paymentType === 'emi' ? 'Credit Sale (EMI)' : 'Credit Sale (Pay Later)';
    await logAction(parseInt(adminId), 'CREATE', actionType, creditSaleId, connection);

    await connection.commit();

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/inventory");
    return { success: `${paymentType === 'emi' ? 'EMI credit sale' : 'Pay later sale'} recorded successfully.` };

  } catch (error) {
    console.error("Credit sale error:", error);
    if (connection) await connection.rollback();
    const errorMessage = error instanceof Error ? error.message : 'Error: Failed to record credit sale.';
    return { error: errorMessage };
  } finally {
    if (connection) connection.release();
  }
}

// Additional essential functions
export async function getUsers(): Promise<User[]> {
    try {
        return await dbGetUsers();
    } catch (error) {
        console.error("Failed to fetch users:", error);
        throw new Error('Error: Failed to fetch users.');
    }
}

export async function getItems(): Promise<Item[]> {
    try {
        return await dbGetItems();
    } catch (error) {
        console.error("Failed to fetch items:", error);
        return [];
    }
}

export async function getLeads() {
    try {
        return await dbGetLeads();
    } catch (error) {
        console.error("Failed to fetch leads:", error);
        return [];
    }
}

export async function getAuditLogs() {
    try {
        const logs = await dbGetAuditLogs();
        const allUsers = await dbGetUsers();
        return logs.map(log => {
            const user = allUsers.find(u => u.id === log.user_id);
            return {
                ...log,
                userName: user ? user.name : 'Unknown User'
            }
        }).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
        console.error("Failed to fetch audit logs:", error);
        throw new Error('Error: Failed to fetch audit logs.');
    }
}

export async function getDashboardPageData() {
    try {
        const users = await dbGetUsers();
        const categories = await dbGetCategories();
        const items = await dbGetItems();
        const inventoryLots = await dbGetInventoryLots();
        const assignments = await dbGetAssignments();
        const sales = await dbGetSales();
        // Fetch credit sales for revenue breakdown (cash vs pending)
        const creditSales = await getCreditSales();

        return {
            data: {
                users,
                categories,
                items,
                inventoryLots,
                assignments,
                sales,
                creditSales,
            }
        };
    } catch (error) {
        console.error("Failed to fetch dashboard page data:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { error: errorMessage };
    }
}

export async function getInventoryPageData() {
    try {
        const users = await dbGetUsers();
        const categories = await dbGetCategories();
        const items = await dbGetItems();
        const inventoryLots = await dbGetInventoryLots();
        const assignments = await dbGetAssignments();
        const sales = await dbGetSales();

        const inventoryData = items.map(item => {
            const category = categories.find(c => c.id === item.category_id);
            const lots = inventoryLots.filter(lot => lot.item_id === item.id);
            const itemAssignments = assignments.filter(a => a.item_id === item.id);
            
            const totalPurchased = lots.reduce((sum, lot) => sum + lot.qty_purchased, 0);
            const totalAssignedForItem = itemAssignments.reduce((sum, a) => sum + a.qty_assigned, 0);
            
            const latestLot = lots.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

            return {
              itemId: item.id,
              itemName: item.name,
              categoryName: category?.name || 'Uncategorized',
              sku: item.sku,
              totalPurchased: totalPurchased,
              totalAssigned: totalAssignedForItem,
              globalAvailable: totalPurchased - totalAssignedForItem,
              costPrice: parseFloat(latestLot?.cost_price as any) || 0,
              sellingPrice: parseFloat(latestLot?.selling_price as any) || parseFloat(item.default_selling_price as any),
            };
          });

        return {
            data: {
                users,
                categories,
                items,
                assignments,
                sales,
                inventoryData,
            }
        };
    } catch (error) {
        console.error("Error fetching inventory page data:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { error: errorMessage };
    }
}

export async function getSalesPageData(currentUserId: number) {
    try {
        const allUsers = await dbGetUsers();
        const currentUser = allUsers.find(u => u.id === currentUserId);
        
        if (!currentUser) {
            return { data: { users: allUsers, salesData: [], creditSales: [] } };
        }

        let salesRecords = await dbGetSales();
        const allItems = await dbGetItems();
        const allCategories = await dbGetCategories();
        const allCreditSales = await getCreditSales();
        
        if (currentUser.role !== 'superadmin') {
            salesRecords = salesRecords.filter(s => s.admin_user_id === currentUser.id);
            const filteredCreditSales = (allCreditSales as any[]).filter(cs => cs.admin_id === currentUser.id);
            const salesData = salesRecords.map(sale => {
                const item = allItems.find(i => i.id === sale.item_id);
                const category = allCategories.find(c => c.id === item?.category_id);
                const admin = allUsers.find(u => u.id === sale.admin_user_id);
                return {
                    ...sale,
                    itemName: item?.name || "Unknown Item",
                    categoryName: category?.name || "Uncategorized",
                    adminName: admin?.name || "Unknown Admin"
                }
            }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            return {
                data: {
                    users: allUsers,
                    salesData,
                    creditSales: filteredCreditSales,
                }
            }
        }

        const salesData = salesRecords.map(sale => {
            const item = allItems.find(i => i.id === sale.item_id);
            const category = allCategories.find(c => c.id === item?.category_id);
            const admin = allUsers.find(u => u.id === sale.admin_user_id);
            return {
                ...sale,
                itemName: item?.name || "Unknown Item",
                categoryName: category?.name || "Uncategorized",
                adminName: admin?.name || "Unknown Admin"
            }
        }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        return {
            data: {
                users: allUsers,
                salesData,
                creditSales: allCreditSales,
            }
        }
    } catch (error) {
        console.error("Error fetching sales page data:", error);
        if (error instanceof Error) {
           return { error: error.message };
        }
        return { error: "An unknown error occurred while fetching sales data." };
    }
}

// Sale recording function
const recordSaleSchema = z.object({
    itemId: z.coerce.number(),
    adminId: z.coerce.number(),
    quantity: z.coerce.number().min(1),
    unitPrice: z.coerce.number().min(0),
    customerName: z.string().min(1, "Customer name is required."),
    customerAddress: z.string().optional(),
    customerPhone: z.string().optional(),
});

export async function recordSale(formData: FormData) {
    try {
        const rawData = Object.fromEntries(formData.entries());
        if (rawData.customerPhone) {
            const phoneSchema = z.string().refine((val) => /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(val) || val === '', { message: "Invalid phone number format."});
            const phoneResult = phoneSchema.safeParse(rawData.customerPhone);
            if (!phoneResult.success) {
                return { error: "Invalid phone number format." }
            }
        }

        const validatedFields = recordSaleSchema.safeParse(rawData);

        if (!validatedFields.success) {
            return { error: "Invalid data provided." };
        }

        const { itemId, adminId, quantity, unitPrice, customerName, customerAddress, customerPhone } = validatedFields.data;
        
        const [adminAssignments, adminSales, items] = await Promise.all([
            dbGetAssignments(),
            dbGetSales(),
            dbGetItems(),
        ]);

        const currentItem = items.find(item => item.id === itemId);
        if (!currentItem) {
            throw new Error('Item not found.');
        }
        const currentPrice = parseFloat(currentItem.default_selling_price as any) || 0;

        const totalAssignedToAdmin = adminAssignments
            .filter(a => a.admin_user_id === adminId && a.item_id === itemId)
            .reduce((sum, a) => sum + a.qty_assigned, 0);
        
        const totalSoldByAdmin = adminSales
            .filter(s => s.admin_user_id === adminId && s.item_id === itemId)
            .reduce((sum, s) => sum + s.qty_sold, 0);

        const adminAvailable = totalAssignedToAdmin - totalSoldByAdmin;

        if (quantity > adminAvailable) {
            throw new Error('Not enough stock to sell.');
        }

        const newSale = await dbAddSale({
            item_id: itemId,
            admin_user_id: adminId,
            qty_sold: quantity,
            unit_price: currentPrice,
            total_price: quantity * currentPrice,
            customer_name: customerName,
            customer_address: customerAddress || null,
            customer_phone: customerPhone || null,
        });

        await logAction(adminId, 'SELL', 'Sale', newSale.id);

        revalidatePath("/dashboard/inventory");
        revalidatePath("/dashboard/sales");
        revalidatePath("/dashboard");
        return { success: "Sale recorded successfully." };
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'Error: Failed to record sale.';
        return { error: errorMessage };
    }
}

// User management functions
const createUserSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['book_admin', 'counter_admin', 'japa_admin', 'superadmin']),
});

export async function createUser(formData: FormData) {
    try {
        const validatedFields = createUserSchema.safeParse(
            Object.fromEntries(formData.entries())
        );

        if (!validatedFields.success) {
            return { error: "Invalid data provided." };
        }
        
        const superadminId = 1;
        const { name, email, phone, role, password } = validatedFields.data;

        const allUsers = await dbGetUsers(); 
        const existingUser = allUsers.find(u => u.email === email);
        if (existingUser) {
            return { error: "A user with this email already exists." };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await addUser({
            name,
            email,
            phone,
            role,
            password: hashedPassword,
        });

        try {
            await logAction(superadminId, 'CREATE', 'User', newUser.id);
        } catch (logError) {
            console.error("Failed to log user creation:", logError);
        }

        revalidatePath("/dashboard/users");
        revalidatePath("/dashboard");
        return { success: "User created successfully." };
    } catch (error) {
        console.error("User creation error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Error: Failed to create user.';
        return { error: errorMessage };
    }
}

export async function deleteUser(userId: number) {
    try {
        const superadminId = 1;
        
        const user = await dbGetUserById(userId);
        if (!user) {
            return { error: "User not found." };
        }
        
        if (user.role === 'superadmin') {
            return { error: "Cannot delete superadmin users." };
        }

        const connection = await pool.getConnection();
        try {
            await connection.query('SET FOREIGN_KEY_CHECKS = 0');
            await logAction(superadminId, 'DELETE', 'User', userId, connection);
            await connection.query('DELETE FROM users WHERE id = ?', [userId]);
            await connection.query('DELETE FROM audit_logs WHERE user_id = ?', [userId]);
            await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        } finally {
            connection.release();
        }

        revalidatePath("/dashboard/users");
        revalidatePath("/dashboard");
        return { success: "User deleted successfully." };
    } catch (error) {
        console.error("User deletion error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Error: Failed to delete user.';
        return { error: errorMessage };
    }
}

export async function toggleUserStatus(userId: number) {
    try {
        const superadminId = 1;
        
        const user = await dbGetUserById(userId);
        if (!user) {
            return { error: "User not found." };
        }
        
        if (user.role === 'superadmin') {
            return { error: "Cannot modify superadmin users." };
        }

        const newStatus = !user.is_active;
        
        const connection = await pool.getConnection();
        try {
            await connection.query('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, userId]);
            await logAction(superadminId, 'UPDATE', 'User', userId, connection);
        } finally {
            connection.release();
        }

        revalidatePath("/dashboard/users");
        revalidatePath("/dashboard");
        return { success: `User ${newStatus ? 'activated' : 'deactivated'} successfully.` };
    } catch (error) {
        console.error("User status toggle error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Error: Failed to update user status.';
        return { error: errorMessage };
    }
}

const resetPasswordSchema = z.object({
    userId: z.coerce.number(),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function resetUserPassword(formData: FormData) {
    try {
        const validatedFields = resetPasswordSchema.safeParse(
            Object.fromEntries(formData.entries())
        );

        if (!validatedFields.success) {
            return { error: "Invalid data provided." };
        }
        
        const superadminId = 1;
        const { userId, newPassword } = validatedFields.data;

        const user = await dbGetUserById(userId);
        if (!user) {
            return { error: "User not found." };
        }
        
        if (user.role === 'superadmin') {
            return { error: "Cannot reset superadmin password." };
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        const connection = await pool.getConnection();
        try {
            await connection.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
            await logAction(superadminId, 'UPDATE', 'User', userId, connection);
        } finally {
            connection.release();
        }

        revalidatePath("/dashboard/users");
        return { success: "Password reset successfully." };
    } catch (error) {
        console.error("Password reset error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Error: Failed to reset password.';
        return { error: errorMessage };
    }
}

// Inventory management functions
const assignStockSchema = z.object({
  itemId: z.coerce.number(),
  adminId: z.coerce.number(),
  quantity: z.coerce.number().min(1),
  userId: z.coerce.number(),
});

const addInventorySchema = z.object({
  itemId: z.coerce.number(),
  quantity: z.coerce.number().min(1),
  costPrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
});

export async function addInventory(formData: FormData) {
  let connection;
  try {
    const validatedFields = addInventorySchema.safeParse(
      Object.fromEntries(formData.entries())
    );

    if (!validatedFields.success) {
      return { error: "Invalid data provided." };
    }
    const { itemId, quantity, costPrice, sellingPrice } = validatedFields.data;
    
    const superadminId = 1; // Assuming superadmin is making this change

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const newLot = await dbAddInventoryLot({
        item_id: itemId,
        qty_purchased: quantity,
        cost_price: costPrice,
        selling_price: sellingPrice,
    }, connection);

    await logAction(superadminId, 'CREATE', 'InventoryLot', newLot.id, connection);
    
    await connection.commit();
    
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard");
    return { success: "Inventory added successfully." };
  } catch (error) {
      console.error("Inventory addition error:", error);
      if (connection) await connection.rollback();
      const errorMessage = error instanceof Error ? error.message : 'Error: Failed to add inventory.';
      return { error: errorMessage };
  } finally {
      if (connection) connection.release();
  }
}

export async function assignStock(formData: FormData) {
    try {
        const validatedFields = assignStockSchema.safeParse(
            Object.fromEntries(formData.entries())
          );
        
        if (!validatedFields.success) {
            return { error: "Invalid data provided." };
        }
        const { itemId, adminId, quantity, userId } = validatedFields.data;

        const [allInventory, allAssignments] = await Promise.all([
            dbGetInventoryLots(),
            dbGetAssignments(),
        ]);

        const totalPurchased = allInventory.filter(lot => lot.item_id === itemId).reduce((sum, lot) => sum + lot.qty_purchased, 0);
        const totalAssigned = allAssignments.filter(a => a.item_id === itemId).reduce((sum, a) => sum + a.qty_assigned, 0);
            
        const globalAvailable = totalPurchased - totalAssigned;

        if (quantity > globalAvailable) {
            throw new Error('Not enough global stock to assign.');
        }
        
        const allLots = await dbGetInventoryLots();
        const sourceLot = allLots.find(lot => lot.item_id === itemId);
        if (!sourceLot) {
            throw new Error("Cannot assign stock as there are no inventory lots for this item.");
        }

        const newAssignment = await dbAddAssignment({
            item_id: itemId,
            admin_user_id: adminId,
            qty_assigned: quantity,
            source_lot_id: sourceLot.id,
        });

        await logAction(userId, 'ASSIGN', 'Assignment', newAssignment.id);
        
        revalidatePath("/dashboard/inventory");
        revalidatePath("/dashboard");
        return { success: "Stock assigned successfully." };
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'Error: Failed to assign stock.';
        return { error: errorMessage };
    }
}

const adjustQuantitySchema = z.object({
  itemId: z.coerce.number(),
  adjustment: z.coerce.number(),
  reason: z.string().min(1, 'Reason is required'),
  userId: z.coerce.number(),
});

export async function adjustInventoryQuantity(formData: FormData) {
  let connection;
  try {
    const validatedFields = adjustQuantitySchema.safeParse(
      Object.fromEntries(formData.entries())
    );

    if (!validatedFields.success) {
      return { error: "Invalid data provided." };
    }
    const { itemId, adjustment, reason, userId } = validatedFields.data;

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const adjustmentLot = await dbAddInventoryLot({
        item_id: itemId,
        qty_purchased: adjustment,
        cost_price: 0,
        selling_price: 0,
    }, connection);

    await logAction(userId, 'ADJUST', 'InventoryLot', adjustmentLot.id, connection);
    
    await connection.commit();
    
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard");
    return { success: `Inventory quantity adjusted by ${adjustment > 0 ? '+' : ''}${adjustment} successfully.` };
  } catch (error) {
      console.error("Inventory adjustment error:", error);
      if (connection) await connection.rollback();
      const errorMessage = error instanceof Error ? error.message : 'Error: Failed to adjust inventory quantity.';
      return { error: errorMessage };
  } finally {
      if (connection) connection.release();
  }
}

const updateInventorySchema = z.object({
  itemId: z.coerce.number(),
  costPrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  userId: z.coerce.number(),
});

export async function updateInventory(formData: FormData) {
  let connection;
  try {
    const validatedFields = updateInventorySchema.safeParse(
      Object.fromEntries(formData.entries())
    );

    if (!validatedFields.success) {
      return { error: "Invalid data provided." };
    }
    const { itemId, costPrice, sellingPrice, userId } = validatedFields.data;

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [result] = await connection.query(
      'UPDATE inventory_lots SET cost_price = ?, selling_price = ? WHERE item_id = ?',
      [costPrice, sellingPrice, itemId]
    );

    await connection.query(
      'UPDATE items SET default_selling_price = ? WHERE id = ?',
      [sellingPrice, itemId]
    );

    await logAction(userId, 'UPDATE', 'InventoryLot', itemId, connection);
    
    await connection.commit();
    
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard");
    return { success: "Inventory updated successfully." };
  } catch (error) {
      console.error("Inventory update error:", error);
      if (connection) await connection.rollback();
      const errorMessage = error instanceof Error ? error.message : 'Error: Failed to update inventory.';
      return { error: errorMessage };
  } finally {
      if (connection) connection.release();
  }
}

export async function deleteInventoryItem(itemId: number, userId: number) {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check if item has any assignments
    const [assignments] = await connection.query(
      'SELECT COUNT(*) as count FROM assignments WHERE item_id = ?',
      [itemId]
    );

    if ((assignments as any)[0].count > 0) {
      return { error: "Cannot delete item with existing assignments." };
    }

    // Delete all inventory lots for this item
    await connection.query('DELETE FROM inventory_lots WHERE item_id = ?', [itemId]);

    await logAction(userId, 'DELETE', 'InventoryLot', itemId, connection);
    
    await connection.commit();
    
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard");
    return { success: "Inventory item deleted successfully." };
  } catch (error) {
      console.error("Inventory deletion error:", error);
      if (connection) await connection.rollback();
      const errorMessage = error instanceof Error ? error.message : 'Error: Failed to delete inventory item.';
      return { error: errorMessage };
  } finally {
      if (connection) connection.release();
  }
}

export async function getCreditSales() {
  try {
    const connection = await pool.getConnection();
    
    const [creditSales] = await connection.query(`
      SELECT 
        cs.id,
        cs.item_id,
        cs.admin_id,
        cs.total_price,
        cs.down_payment,
        cs.pending_balance,
        cs.payment_type,
        cs.emi_periods,
        cs.monthly_emi,
        cs.pay_later_date,
        cs.status,
        cs.created_at,
        cs.customer_name,
        cs.customer_email,
        cs.customer_phone,
        i.name as item_name,
        u.name as admin_name
      FROM credit_sales cs
      JOIN items i ON cs.item_id = i.id
      JOIN users u ON cs.admin_id = u.id
      ORDER BY cs.created_at DESC
    `);
    
    connection.release();
    return creditSales;
  } catch (error) {
    console.error('Error fetching credit sales:', error);
    throw error;
  }
}

export async function markCreditSaleCompleted(saleId: number) {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Update credit sale status to completed
    await connection.query(
      'UPDATE credit_sales SET status = ?, pending_balance = 0 WHERE id = ?',
      ['completed', saleId]
    );

    // Get the current user ID for logging
    const userId = 1; // You might want to pass this as a parameter
    await logAction(userId, 'UPDATE', 'Credit Sale', saleId, connection);
    
    await connection.commit();
    
    revalidatePath("/dashboard/credit");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/sales");
    return { success: "Credit sale marked as completed." };
  } catch (error) {
    console.error("Error marking credit sale as completed:", error);
    if (connection) await connection.rollback();
    const errorMessage = error instanceof Error ? error.message : 'Error: Failed to mark credit sale as completed.';
    return { error: errorMessage };
  } finally {
    if (connection) connection.release();
  }
}

// Item creation
const createItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  categoryId: z.coerce.number().int().min(1, 'Category is required'),
  defaultSellingPrice: z.coerce.number().min(0),
});

export async function createItem(formData: FormData) {
  try {
    const raw = Object.fromEntries(formData.entries());
    const parsed = createItemSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: 'Invalid data provided.' };
    }
    const { name, sku, categoryId, defaultSellingPrice } = parsed.data;

    const item = await dbAddItem({
      name,
      sku,
      category_id: categoryId,
      default_selling_price: defaultSellingPrice,
    } as any);

    try {
      await logAction(1, 'CREATE', 'Item', item.id);
    } catch (e) {
      console.error('Failed to log createItem:', e);
    }

    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard');
    return { success: 'Item created successfully.' };
  } catch (error) {
    console.error('createItem error:', error);
    const message = error instanceof Error ? error.message : 'Error: Failed to create item.';
    return { error: message };
  }
}

export async function deleteItem(itemId: number) {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check if item has any inventory lots, assignments, or sales
    const [inventoryLots] = await connection.query('SELECT COUNT(*) as count FROM inventory_lots WHERE item_id = ?', [itemId]);
    const [assignments] = await connection.query('SELECT COUNT(*) as count FROM assignments WHERE item_id = ?', [itemId]);
    const [sales] = await connection.query('SELECT COUNT(*) as count FROM sales WHERE item_id = ?', [itemId]);
    const [creditSales] = await connection.query('SELECT COUNT(*) as count FROM credit_sales WHERE item_id = ?', [itemId]);

    if ((inventoryLots as any)[0].count > 0 || (assignments as any)[0].count > 0 || (sales as any)[0].count > 0 || (creditSales as any)[0].count > 0) {
      return { error: 'Cannot delete item. It has associated inventory, assignments, or sales records.' };
    }

    // Delete the item
    await connection.query('DELETE FROM items WHERE id = ?', [itemId]);
    
    try {
      await logAction(1, 'DELETE', 'Item', itemId, connection);
    } catch (e) {
      console.error('Failed to log deleteItem:', e);
    }

    await connection.commit();
    
    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard');
    return { success: 'Item deleted successfully.' };
  } catch (error) {
    console.error('deleteItem error:', error);
    if (connection) await connection.rollback();
    const message = error instanceof Error ? error.message : 'Error: Failed to delete item.';
    return { error: message };
  } finally {
    if (connection) connection.release();
  }
}

const updateItemSchema = z.object({
  itemId: z.coerce.number().int().min(1),
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  categoryId: z.coerce.number().int().min(1, 'Category is required'),
  defaultSellingPrice: z.coerce.number().min(0),
});

export async function updateItem(formData: FormData) {
  let connection;
  try {
    const raw = Object.fromEntries(formData.entries());
    const parsed = updateItemSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: 'Invalid data provided.' };
    }
    const { itemId, name, sku, categoryId, defaultSellingPrice } = parsed.data;

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Update the item
    await connection.query(
      'UPDATE items SET name = ?, sku = ?, category_id = ?, default_selling_price = ? WHERE id = ?',
      [name, sku, categoryId, defaultSellingPrice, itemId]
    );
    
    try {
      await logAction(1, 'UPDATE', 'Item', itemId, connection);
    } catch (e) {
      console.error('Failed to log updateItem:', e);
    }

    await connection.commit();
    
    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard');
    return { success: 'Item updated successfully.' };
  } catch (error) {
    console.error('updateItem error:', error);
    if (connection) await connection.rollback();
    const message = error instanceof Error ? error.message : 'Error: Failed to update item.';
    return { error: message };
  } finally {
    if (connection) connection.release();
  }
}

// Category creation
const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

export async function createCategory(formData: FormData) {
  try {
    const raw = Object.fromEntries(formData.entries());
    const parsed = createCategorySchema.safeParse(raw);
    if (!parsed.success) {
      return { error: 'Invalid data provided.' };
    }
    const { name, description } = parsed.data;

    const category = await dbAddCategory({
      name,
      description: description || null,
    } as any);

    try {
      await logAction(1, 'CREATE', 'Category', category.id);
    } catch (e) {
      console.error('Failed to log createCategory:', e);
    }

    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard');
    return { success: 'Category created successfully.' };
  } catch (error) {
    console.error('createCategory error:', error);
    const message = error instanceof Error ? error.message : 'Error: Failed to create category.';
    return { error: message };
  }
}

export async function deleteCategory(categoryId: number) {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check if category has any items
    const [items] = await connection.query('SELECT COUNT(*) as count FROM items WHERE category_id = ?', [categoryId]);

    if ((items as any)[0].count > 0) {
      return { error: 'Cannot delete category. It has associated items.' };
    }

    // Delete the category
    await connection.query('DELETE FROM categories WHERE id = ?', [categoryId]);
    
    try {
      await logAction(1, 'DELETE', 'Category', categoryId, connection);
    } catch (e) {
      console.error('Failed to log deleteCategory:', e);
    }

    await connection.commit();
    
    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard');
    return { success: 'Category deleted successfully.' };
  } catch (error) {
    console.error('deleteCategory error:', error);
    if (connection) await connection.rollback();
    const message = error instanceof Error ? error.message : 'Error: Failed to delete category.';
    return { error: message };
  } finally {
    if (connection) connection.release();
  }
}

const updateCategorySchema = z.object({
  categoryId: z.coerce.number().int().min(1),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

export async function updateCategory(formData: FormData) {
  let connection;
  try {
    const raw = Object.fromEntries(formData.entries());
    const parsed = updateCategorySchema.safeParse(raw);
    if (!parsed.success) {
      return { error: 'Invalid data provided.' };
    }
    const { categoryId, name, description } = parsed.data;

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Update the category
    await connection.query(
      'UPDATE categories SET name = ?, description = ? WHERE id = ?',
      [name, description || null, categoryId]
    );
    
    try {
      await logAction(1, 'UPDATE', 'Category', categoryId, connection);
    } catch (e) {
      console.error('Failed to log updateCategory:', e);
    }

    await connection.commit();
    
    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard');
    return { success: 'Category updated successfully.' };
  } catch (error) {
    console.error('updateCategory error:', error);
    if (connection) await connection.rollback();
    const message = error instanceof Error ? error.message : 'Error: Failed to update category.';
    return { error: message };
  } finally {
    if (connection) connection.release();
  }
}

// Lead management actions
const createLeadSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_phone: z.string().min(10, 'Valid phone number is required'),
  customer_email: z.string().email().optional().or(z.literal('')),
  customer_address: z.string().optional(),
  interested_item_id: z.coerce.number().optional(),
  notes: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  follow_up_date: z.string().optional(),
});

export async function createLead(formData: FormData) {
  try {
    console.log('createLead called with formData:', Object.fromEntries(formData.entries()));
    
    const raw = Object.fromEntries(formData.entries());
    console.log('Raw form data:', raw);
    
    const parsed = createLeadSchema.safeParse(raw);
    
    if (!parsed.success) {
      console.error('Schema validation failed:', parsed.error);
      return { error: `Invalid lead data: ${parsed.error.issues.map(i => i.message).join(', ')}` };
    }

    console.log('Parsed data:', parsed.data);

    const { customer_name, customer_phone, customer_email, customer_address, interested_item_id, notes, priority, follow_up_date } = parsed.data;
    const admin_user_id = parseInt(raw.admin_user_id as string);

    if (isNaN(admin_user_id)) {
      console.error('Invalid admin_user_id:', raw.admin_user_id);
      return { error: 'Invalid admin user ID' };
    }

    console.log('About to call dbAddLead with:', {
      admin_user_id,
      customer_name,
      customer_phone,
      customer_email: customer_email || '',
      customer_address: customer_address || '',
      interested_item_id: interested_item_id || null,
      notes: notes || '',
      status: 'new',
      priority,
      follow_up_date: follow_up_date || null
    });

    const result = await dbAddLead(
      admin_user_id,
      customer_name,
      customer_phone,
      customer_email || '',
      customer_address || '',
      interested_item_id || null,
      notes || '',
      'new',
      priority,
      follow_up_date || null
    );

    console.log('dbAddLead result:', result);

    await addLog({
      user_id: admin_user_id,
      action: 'CREATE',
      entity_type: 'lead',
      entity_id: result.id
    });
    
    revalidatePath('/dashboard/leads');
    return { success: true, leadId: result.id };
  } catch (error) {
    console.error('Failed to create lead - detailed error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return { error: `Failed to create lead: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export async function getLeadsPageData() {
  try {
    const [users, items, leads] = await Promise.all([
      getUsers(),
      getItems(),
      getLeads()
    ]);

    // Join leads with user and item data
    const leadsWithDetails = leads.map(lead => ({
      ...lead,
      admin_name: users.find(u => u.id === lead.admin_user_id)?.name || 'Unknown',
      item_name: lead.interested_item_id ? items.find(i => i.id === lead.interested_item_id)?.name || 'Unknown Item' : null
    }));

    return {
      data: {
        users,
        items,
        leads: leadsWithDetails
      }
    };
  } catch (error) {
    console.error('Failed to fetch leads page data:', error);
    return { error: 'Failed to fetch leads data' };
  }
}

const updateLeadSchema = z.object({
  id: z.coerce.number(),
  customer_name: z.string().min(1),
  customer_phone: z.string().min(10),
  customer_email: z.string().email().optional().or(z.literal('')),
  customer_address: z.string().optional(),
  interested_item_id: z.coerce.number().optional(),
  notes: z.string().optional(),
  status: z.enum(['new', 'contacted', 'interested', 'converted', 'lost']),
  priority: z.enum(['low', 'medium', 'high']),
  follow_up_date: z.string().optional(),
});

export async function updateLead(formData: FormData) {
  let connection;
  try {
    const raw = Object.fromEntries(formData.entries());
    const parsed = updateLeadSchema.safeParse(raw);
    
    if (!parsed.success) {
      return { error: 'Invalid lead data' };
    }

    const { id, customer_name, customer_phone, customer_email, customer_address, interested_item_id, notes, status, priority, follow_up_date } = parsed.data;

    connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.execute(
      `UPDATE leads SET 
        customer_name = ?, customer_phone = ?, customer_email = ?, customer_address = ?,
        interested_item_id = ?, notes = ?, status = ?, priority = ?, follow_up_date = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        customer_name, 
        customer_phone, 
        customer_email || null, 
        customer_address || null,
        interested_item_id || null, 
        notes || null, 
        status, 
        priority, 
        follow_up_date || null, 
        id
      ]
    );

    await addLog('UPDATE', 'lead', id, 1, connection);
    await connection.commit();

    revalidatePath('/dashboard/leads');
    return { success: true };
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Failed to update lead:', error);
    return { error: 'Failed to update lead' };
  } finally {
    if (connection) connection.release();
  }
}

export async function deleteLead(leadId: number) {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.execute('DELETE FROM leads WHERE id = ?', [leadId]);
    await addLog('DELETE', 'lead', leadId, 1, connection);
    await connection.commit();

    revalidatePath('/dashboard/leads');
    return { success: true };
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Failed to delete lead:', error);
    return { error: 'Failed to delete lead' };
  } finally {
    if (connection) connection.release();
  }
}
