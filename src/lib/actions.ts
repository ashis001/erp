
"use server";

import { suggestOptimalSellingPrice } from "@/ai/flows/suggest-optimal-price";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import bcrypt from 'bcryptjs';
import {
  addUser,
  addInventoryLot as dbAddInventoryLot,
  addAssignment as dbAddAssignment,
  addSale as dbAddSale,
  addLog,
  getUsers as dbGetUsers,
  getCategories as dbGetCategories,
  getItems as dbGetItems,
  getInventoryLots as dbGetInventoryLots,
  getAssignments as dbGetAssignments,
  getUserById as dbGetUserById,
  getSales as dbGetSales,
  getAuditLogs as dbGetAuditLogs,
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

const updateInventorySchema = z.object({
  itemId: z.coerce.number(),
  costPrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  userId: z.coerce.number(),
});

const adjustQuantitySchema = z.object({
  itemId: z.coerce.number(),
  adjustment: z.coerce.number(),
  reason: z.string().min(1, 'Reason is required'),
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

    // Update all inventory lots for this item to maintain consistency
    const [result] = await connection.query(
      'UPDATE inventory_lots SET cost_price = ?, selling_price = ? WHERE item_id = ?',
      [costPrice, sellingPrice, itemId]
    );

    // Also update the default selling price in the items table
    await connection.query(
      'UPDATE items SET default_selling_price = ? WHERE id = ?',
      [sellingPrice, itemId]
    );
    
    console.log('Update result:', result);

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

    // Create a new inventory lot with the adjustment
    const adjustmentLot = await dbAddInventoryLot({
        item_id: itemId,
        qty_purchased: adjustment,
        cost_price: 0, // Adjustment lots have no cost
        selling_price: 0, // Will use existing selling price
    }, connection);

    // Log the adjustment with reason using the existing logAction function
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

const assignStockSchema = z.object({
  itemId: z.coerce.number(),
  adminId: z.coerce.number(),
  quantity: z.coerce.number().min(1),
  userId: z.coerce.number(),
});

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
        
        // In a real DB, we would likely do an UPDATE ... SET qty = qty + ?
        // For now, we'll just create a new assignment record as the schema suggests.
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

        // Get current price from database instead of using cached price
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


const priceSuggestionSchema = z.object({
  itemName: z.string(),
  categoryName: z.string(),
  costPrice: z.coerce.number(),
  currentSellingPrice: z.coerce.number(),
});

export async function getPriceSuggestion(formData: FormData) {
  try {
    const validatedFields = priceSuggestionSchema.safeParse(
      Object.fromEntries(formData.entries())
    );

    if (!validatedFields.success) {
      return { error: "Invalid data for price suggestion." };
    }

    const suggestion = await suggestOptimalSellingPrice({
      ...validatedFields.data,
      item_id: "temp-id", 
    });

    return { suggestion };
  } catch (e) {
    console.error(e);
    return { error: "Failed to get AI suggestion." };
  }
}

export async function getUsers(): Promise<User[]> {
    try {
        return await dbGetUsers();
    } catch (error) {
        console.error("Failed to fetch users:", error);
        throw new Error('Error: Failed to fetch users.');
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

const createUserSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
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
        
        const superadminId = 1; // This should be the current logged-in superadmin's ID
        const { name, email, role, password } = validatedFields.data;

        const allUsers = await dbGetUsers(); 
        const existingUser = allUsers.find(u => u.email === email);
        if (existingUser) {
            return { error: "A user with this email already exists." };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user without transaction first
        const newUser = await addUser({
            name,
            email,
            role,
            password: hashedPassword,
        });

        // Log the action separately
        try {
            await logAction(superadminId, 'CREATE', 'User', newUser.id);
        } catch (logError) {
            console.error("Failed to log user creation:", logError);
            // Don't fail the entire operation if logging fails
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
        
        // Check if user exists and is not a superadmin
        const user = await dbGetUserById(userId);
        if (!user) {
            return { error: "User not found." };
        }
        
        if (user.role === 'superadmin') {
            return { error: "Cannot delete superadmin users." };
        }

        // Delete user from database
        const connection = await pool.getConnection();
        try {
            // Disable foreign key checks temporarily
            await connection.query('SET FOREIGN_KEY_CHECKS = 0');
            
            // Log the deletion action first
            await logAction(superadminId, 'DELETE', 'User', userId, connection);
            
            // Delete the user
            await connection.query('DELETE FROM users WHERE id = ?', [userId]);
            
            // Delete related audit logs
            await connection.query('DELETE FROM audit_logs WHERE user_id = ?', [userId]);
            
            // Re-enable foreign key checks
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
        
        // Get current user status
        const user = await dbGetUserById(userId);
        if (!user) {
            return { error: "User not found." };
        }
        
        if (user.role === 'superadmin') {
            return { error: "Cannot modify superadmin users." };
        }

        const newStatus = !user.is_active;
        
        // Update user status
        const connection = await pool.getConnection();
        try {
            await connection.query('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, userId]);
            
            // Log the action with the same connection
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

        // Check if user exists and is not a superadmin
        const user = await dbGetUserById(userId);
        if (!user) {
            return { error: "User not found." };
        }
        
        if (user.role === 'superadmin') {
            return { error: "Cannot reset superadmin password." };
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update user password
        const connection = await pool.getConnection();
        try {
            await connection.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
            
            // Log the action with the same connection
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

export async function getDashboardPageData() {
    try {
        // Fetch data sequentially to avoid overwhelming the database connection pool
        const users = await dbGetUsers();
        const categories = await dbGetCategories();
        const items = await dbGetItems();
        const inventoryLots = await dbGetInventoryLots();
        const assignments = await dbGetAssignments();
        const sales = await dbGetSales();

        return {
            data: {
                users,
                categories,
                items,
                inventoryLots,
                assignments,
                sales,
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
            return { data: { users: allUsers, salesData: [] } };
        }

        let salesRecords = await dbGetSales();
        const allItems = await dbGetItems();
        const allCategories = await dbGetCategories();
        
        if (currentUser.role !== 'superadmin') {
            salesRecords = salesRecords.filter(s => s.admin_user_id === currentUser.id);
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

// Category Management Actions
const createCategorySchema = z.object({
    name: z.string().min(2, 'Category name must be at least 2 characters'),
    description: z.string().optional(),
});

export async function createCategory(formData: FormData) {
    let connection;
    try {
        const validatedFields = createCategorySchema.safeParse(
            Object.fromEntries(formData.entries())
        );

        if (!validatedFields.success) {
            return { error: "Invalid data provided." };
        }

        const { name, description } = validatedFields.data;
        const superadminId = 1;

        // Check if category already exists
        const categories = await dbGetCategories();
        const existingCategory = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
        if (existingCategory) {
            return { error: "A category with this name already exists." };
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [result] = await connection.query(
            'INSERT INTO categories (name, description) VALUES (?, ?)',
            [name, description || null]
        );

        const newCategoryId = (result as any).insertId;

        await logAction(superadminId, 'CREATE', 'Category', newCategoryId, connection);
        await connection.commit();

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/inventory");
        return { success: "Category created successfully." };
    } catch (error) {
        console.error("Category creation error:", error);
        if (connection) await connection.rollback();
        const errorMessage = error instanceof Error ? error.message : 'Error: Failed to create category.';
        return { error: errorMessage };
    } finally {
        if (connection) connection.release();
    }
}

export async function deleteCategory(categoryId: number) {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Check if category has any items
        const [items] = await connection.query(
            'SELECT COUNT(*) as count FROM items WHERE category_id = ?',
            [categoryId]
        );

        if ((items as any)[0].count > 0) {
            return { error: "Cannot delete category with existing items." };
        }

        await connection.query('DELETE FROM categories WHERE id = ?', [categoryId]);

        const superadminId = 1;
        await logAction(superadminId, 'DELETE', 'Category', categoryId, connection);
        await connection.commit();

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/inventory");
        return { success: "Category deleted successfully." };
    } catch (error) {
        console.error("Category deletion error:", error);
        if (connection) await connection.rollback();
        const errorMessage = error instanceof Error ? error.message : 'Error: Failed to delete category.';
        return { error: errorMessage };
    } finally {
        if (connection) connection.release();
    }
}

// Item Management Actions
const createItemSchema = z.object({
    categoryId: z.coerce.number(),
    name: z.string().min(2, 'Item name must be at least 2 characters'),
    sku: z.string().min(1, 'SKU is required'),
    defaultSellingPrice: z.coerce.number().min(0, 'Price must be non-negative'),
});

export async function createItem(formData: FormData) {
    let connection;
    try {
        const validatedFields = createItemSchema.safeParse(
            Object.fromEntries(formData.entries())
        );

        if (!validatedFields.success) {
            return { error: "Invalid data provided." };
        }

        const { categoryId, name, sku, defaultSellingPrice } = validatedFields.data;
        const superadminId = 1;

        // Check if SKU already exists
        const items = await dbGetItems();
        const existingSku = items.find(i => i.sku.toLowerCase() === sku.toLowerCase());
        if (existingSku) {
            return { error: "An item with this SKU already exists." };
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [result] = await connection.query(
            'INSERT INTO items (category_id, name, sku, default_selling_price) VALUES (?, ?, ?, ?)',
            [categoryId, name, sku, defaultSellingPrice]
        );

        const newItemId = (result as any).insertId;

        await logAction(superadminId, 'CREATE', 'Item', newItemId, connection);
        await connection.commit();

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/inventory");
        return { success: "Item created successfully." };
    } catch (error) {
        console.error("Item creation error:", error);
        if (connection) await connection.rollback();
        const errorMessage = error instanceof Error ? error.message : 'Error: Failed to create item.';
        return { error: errorMessage };
    } finally {
        if (connection) connection.release();
    }
}

export async function deleteItem(itemId: number) {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Check if item has any inventory lots
        const [lots] = await connection.query(
            'SELECT COUNT(*) as count FROM inventory_lots WHERE item_id = ?',
            [itemId]
        );

        if ((lots as any)[0].count > 0) {
            return { error: "Cannot delete item with existing inventory." };
        }

        // Check if item has any assignments
        const [assignments] = await connection.query(
            'SELECT COUNT(*) as count FROM assignments WHERE item_id = ?',
            [itemId]
        );

        if ((assignments as any)[0].count > 0) {
            return { error: "Cannot delete item with existing assignments." };
        }

        await connection.query('DELETE FROM items WHERE id = ?', [itemId]);

        const superadminId = 1;
        await logAction(superadminId, 'DELETE', 'Item', itemId, connection);
        await connection.commit();

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/inventory");
        return { success: "Item deleted successfully." };
    } catch (error) {
        console.error("Item deletion error:", error);
        if (connection) await connection.rollback();
        const errorMessage = error instanceof Error ? error.message : 'Error: Failed to delete item.';
        return { error: errorMessage };
    } finally {
        if (connection) connection.release();
    }
}

