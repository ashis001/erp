import pool from './db';
import type { User, Category, Item, InventoryLot, Assignment, Sale, AuditLog } from './types';

// --- Data fetching functions ---

async function queryDatabase<T>(sql: string, params: any[] = []): Promise<T[]> {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query(sql, params);
        return rows as T[];
    } finally {
        if (connection) connection.release();
    }
}

export async function getUserById(id: number) {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM `users` WHERE `id` = ?', [id]);
        return (rows as User[])[0] || null;
    } catch (error) {
        console.error('Database error in getUserById:', error);
        return null;
    } finally {
        if (connection) connection.release();
    }
}

export const getUsers = (): Promise<User[]> => queryDatabase<User>('SELECT * FROM `users`');
export const getCategories = (): Promise<Category[]> => queryDatabase<Category>('SELECT * FROM `categories`');
export const getItems = (): Promise<Item[]> => queryDatabase<Item>('SELECT * FROM `items`');
export const getInventoryLots = (): Promise<InventoryLot[]> => queryDatabase<InventoryLot>('SELECT * FROM `inventory_lots`');
export const getAssignments = (): Promise<Assignment[]> => queryDatabase<Assignment>('SELECT * FROM `assignments`');
export const getSales = (): Promise<Sale[]> => queryDatabase<Sale>('SELECT * FROM `sales`');
export const getAuditLogs = (): Promise<AuditLog[]> => queryDatabase<AuditLog>('SELECT * FROM `audit_logs`');

// --- Data manipulation functions ---

async function insertIntoDatabase<T>(sql: string, values: any, tableName: string, existingConnection?: any): Promise<T> {
    let connection = existingConnection;
    let isNewConnection = false;
    try {
        if (!connection) {
            connection = await pool.getConnection();
            isNewConnection = true;
            await connection.beginTransaction();
        }

        const [result] = await connection.query(sql, values);
        const insertId = (result as any).insertId;
        const [newRow] = await connection.query(`SELECT * FROM ${tableName} WHERE id = ?`, [insertId]);
        
        if (isNewConnection) {
            await connection.commit();
        }

        return (newRow as T[])[0];
    } catch (error) {
        if (isNewConnection && connection) {
            await connection.rollback();
        }
        throw error;
    } finally {
        if (isNewConnection && connection) {
            connection.release();
        }
    }
}

export const addUser = (user: Omit<User, 'id' | 'created_at' | 'is_active'>, connection?: any): Promise<User> => {
    return insertIntoDatabase<User>(
        'INSERT INTO `users` (`name`, `email`, `password`, `role`) VALUES (?, ?, ?, ?)',
        [user.name, user.email, user.password, user.role],
        '`users`',
        connection
    );
}


export const addInventoryLot = (lot: Omit<InventoryLot, 'id' | 'created_at'>, connection?: any): Promise<InventoryLot> => {
    return insertIntoDatabase<InventoryLot>(
        'INSERT INTO `inventory_lots` (`item_id`, `qty_purchased`, `cost_price`, `selling_price`) VALUES (?, ?, ?, ?)',
        [lot.item_id, lot.qty_purchased, lot.cost_price, lot.selling_price],
        '`inventory_lots`',
        connection
    );
}

export const addAssignment = (assignment: Omit<Assignment, 'id' | 'created_at'>): Promise<Assignment> => {
    return insertIntoDatabase<Assignment>(
        'INSERT INTO `assignments` (`item_id`, `admin_user_id`, `qty_assigned`, `source_lot_id`) VALUES (?, ?, ?, ?)',
        [assignment.item_id, assignment.admin_user_id, assignment.qty_assigned, assignment.source_lot_id],
        '`assignments`'
    );
}

export const addSale = (sale: Omit<Sale, 'id' | 'created_at' | 'total_price'> & { total_price: number }): Promise<Sale> => {
    return insertIntoDatabase<Sale>(
        'INSERT INTO `sales` (`item_id`, `admin_user_id`, `qty_sold`, `unit_price`, `total_price`, `customer_name`, `customer_address`, `customer_phone`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [sale.item_id, sale.admin_user_id, sale.qty_sold, sale.unit_price, sale.total_price, sale.customer_name, sale.customer_address, sale.customer_phone],
        '`sales`'
    );
}

export const addLog = (log: Omit<AuditLog, 'id' | 'timestamp'>, connection?: any): Promise<AuditLog> => {
    return insertIntoDatabase<AuditLog>(
        'INSERT INTO `audit_logs` (`user_id`, `action`, `entity_type`, `entity_id`) VALUES (?, ?, ?, ?)',
        [log.user_id, log.action, log.entity_type, log.entity_id],
        '`audit_logs`',
        connection
    );
}
