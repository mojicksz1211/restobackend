const pool = require('../config/db');

const STATUS_ACTIVE = 'Active';
const STATUS_INACTIVE = 'Inactive';

class InventoryModel {
	static _schemaReady = false;
	static _schemaPromise = null;

	static async ensureSchema() {
		if (InventoryModel._schemaReady) return;
		if (InventoryModel._schemaPromise) return InventoryModel._schemaPromise;

		InventoryModel._schemaPromise = (async () => {
			await pool.execute(`
				CREATE TABLE IF NOT EXISTS inventory_products (
					IDNo INT AUTO_INCREMENT PRIMARY KEY,
					BRANCH_ID INT NOT NULL,
					CATEGORY_NAME VARCHAR(120) NULL,
					PRODUCT_NAME VARCHAR(180) NOT NULL,
					UNIT VARCHAR(80) NULL,
					TYPE VARCHAR(80) NULL,
					STATUS VARCHAR(20) NOT NULL DEFAULT 'Active',
					PRICE DECIMAL(12,2) NOT NULL DEFAULT 0,
					STOCK DECIMAL(12,3) NOT NULL DEFAULT 0,
					SKU VARCHAR(120) NULL,
					BARCODE VARCHAR(120) NULL,
					DESCRIPTION TEXT NULL,
					ACTIVE TINYINT(1) NOT NULL DEFAULT 1,
					ENCODED_BY INT NULL,
					ENCODED_DT DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
					EDITED_BY INT NULL,
					EDITED_DT DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
					INDEX idx_inventory_products_branch (BRANCH_ID),
					INDEX idx_inventory_products_status (STATUS)
				)
			`);

			await pool.execute(`
				CREATE TABLE IF NOT EXISTS inventory_materials (
					IDNo INT AUTO_INCREMENT PRIMARY KEY,
					BRANCH_ID INT NOT NULL,
					CATEGORY_NAME VARCHAR(120) NULL,
					MATERIAL_NAME VARCHAR(180) NOT NULL,
					UNIT VARCHAR(80) NULL,
					STATUS VARCHAR(20) NOT NULL DEFAULT 'Active',
					STOCK DECIMAL(12,3) NOT NULL DEFAULT 0,
					UNIT_COST DECIMAL(12,2) NOT NULL DEFAULT 0,
					SKU VARCHAR(120) NULL,
					BARCODE VARCHAR(120) NULL,
					DESCRIPTION TEXT NULL,
					ACTIVE TINYINT(1) NOT NULL DEFAULT 1,
					ENCODED_BY INT NULL,
					ENCODED_DT DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
					EDITED_BY INT NULL,
					EDITED_DT DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
					INDEX idx_inventory_materials_branch (BRANCH_ID),
					INDEX idx_inventory_materials_status (STATUS)
				)
			`);

			await pool.execute(`
				CREATE TABLE IF NOT EXISTS menu_inventory_map (
					IDNo INT AUTO_INCREMENT PRIMARY KEY,
					MENU_ID INT NOT NULL,
					PRODUCT_ID INT NULL,
					MATERIAL_ID INT NULL,
					QUANTITY DECIMAL(12,3) NOT NULL DEFAULT 1,
					ACTIVE TINYINT(1) NOT NULL DEFAULT 1,
					ENCODED_BY INT NULL,
					ENCODED_DT DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
					EDITED_BY INT NULL,
					EDITED_DT DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
					INDEX idx_menu_inventory_menu (MENU_ID),
					INDEX idx_menu_inventory_product (PRODUCT_ID),
					INDEX idx_menu_inventory_material (MATERIAL_ID)
				)
			`);

			await pool.execute(`
				CREATE TABLE IF NOT EXISTS order_inventory_deductions (
					IDNo INT AUTO_INCREMENT PRIMARY KEY,
					ORDER_ID INT NOT NULL,
					DEDUCTED_BY INT NULL,
					DEDUCTED_DT DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
					UNIQUE KEY uq_order_inventory_deduction_order (ORDER_ID)
				)
			`);

			await pool.execute(`
				CREATE TABLE IF NOT EXISTS inventory_movements (
					IDNo INT AUTO_INCREMENT PRIMARY KEY,
					ORDER_ID INT NOT NULL,
					MENU_ID INT NOT NULL,
					RESOURCE_TYPE VARCHAR(20) NOT NULL,
					RESOURCE_ID INT NOT NULL,
					QTY_DEDUCTED DECIMAL(12,3) NOT NULL,
					STOCK_BEFORE DECIMAL(12,3) NOT NULL,
					STOCK_AFTER DECIMAL(12,3) NOT NULL,
					ENCODED_BY INT NULL,
					ENCODED_DT DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
					INDEX idx_inventory_movements_order (ORDER_ID),
					INDEX idx_inventory_movements_resource (RESOURCE_TYPE, RESOURCE_ID)
				)
			`);
			InventoryModel._schemaReady = true;
		})().catch((error) => {
			InventoryModel._schemaPromise = null;
			throw error;
		});

		return InventoryModel._schemaPromise;
	}

	static normalizeStatus(status) {
		return status === STATUS_INACTIVE ? STATUS_INACTIVE : STATUS_ACTIVE;
	}

	static async getProducts(branchId = null) {
		await InventoryModel.ensureSchema();
		let query = `
			SELECT
				IDNo,
				BRANCH_ID,
				CATEGORY_NAME,
				PRODUCT_NAME,
				UNIT,
				TYPE,
				STATUS,
				PRICE,
				STOCK,
				SKU,
				BARCODE,
				DESCRIPTION
			FROM inventory_products
			WHERE ACTIVE = 1
		`;
		const params = [];
		if (branchId !== null && branchId !== undefined) {
			query += ` AND BRANCH_ID = ?`;
			params.push(branchId);
		}
		query += ` ORDER BY IDNo DESC`;
		const [rows] = await pool.execute(query, params);
		return rows;
	}

	static async createProduct(data) {
		await InventoryModel.ensureSchema();
		const query = `
			INSERT INTO inventory_products (
				BRANCH_ID, CATEGORY_NAME, PRODUCT_NAME, UNIT, TYPE, STATUS,
				PRICE, STOCK, SKU, BARCODE, DESCRIPTION, ENCODED_BY
			)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`;
		const [result] = await pool.execute(query, [
			data.BRANCH_ID,
			data.CATEGORY_NAME || null,
			data.PRODUCT_NAME,
			data.UNIT || null,
			data.TYPE || null,
			InventoryModel.normalizeStatus(data.STATUS),
			Number(data.PRICE || 0),
			Number(data.STOCK || 0),
			data.SKU || null,
			data.BARCODE || null,
			data.DESCRIPTION || null,
			data.user_id || null,
		]);
		return result.insertId;
	}

	static async updateProduct(id, data) {
		await InventoryModel.ensureSchema();
		const query = `
			UPDATE inventory_products SET
				CATEGORY_NAME = ?,
				PRODUCT_NAME = ?,
				UNIT = ?,
				TYPE = ?,
				STATUS = ?,
				PRICE = ?,
				STOCK = ?,
				SKU = ?,
				BARCODE = ?,
				DESCRIPTION = ?,
				EDITED_BY = ?,
				EDITED_DT = CURRENT_TIMESTAMP
			WHERE IDNo = ? AND ACTIVE = 1
		`;
		const [result] = await pool.execute(query, [
			data.CATEGORY_NAME || null,
			data.PRODUCT_NAME,
			data.UNIT || null,
			data.TYPE || null,
			InventoryModel.normalizeStatus(data.STATUS),
			Number(data.PRICE || 0),
			Number(data.STOCK || 0),
			data.SKU || null,
			data.BARCODE || null,
			data.DESCRIPTION || null,
			data.user_id || null,
			id,
		]);
		return result.affectedRows > 0;
	}

	static async deleteProduct(id, userId) {
		await InventoryModel.ensureSchema();
		const [result] = await pool.execute(
			`UPDATE inventory_products SET ACTIVE = 0, EDITED_BY = ?, EDITED_DT = CURRENT_TIMESTAMP WHERE IDNo = ?`,
			[userId || null, id]
		);
		return result.affectedRows > 0;
	}

	static async getMaterials(branchId = null) {
		await InventoryModel.ensureSchema();
		let query = `
			SELECT
				IDNo,
				BRANCH_ID,
				CATEGORY_NAME,
				MATERIAL_NAME,
				UNIT,
				STATUS,
				STOCK,
				UNIT_COST,
				SKU,
				BARCODE,
				DESCRIPTION
			FROM inventory_materials
			WHERE ACTIVE = 1
		`;
		const params = [];
		if (branchId !== null && branchId !== undefined) {
			query += ` AND BRANCH_ID = ?`;
			params.push(branchId);
		}
		query += ` ORDER BY IDNo DESC`;
		const [rows] = await pool.execute(query, params);
		return rows;
	}

	static async createMaterial(data) {
		await InventoryModel.ensureSchema();
		const query = `
			INSERT INTO inventory_materials (
				BRANCH_ID, CATEGORY_NAME, MATERIAL_NAME, UNIT, STATUS,
				STOCK, UNIT_COST, SKU, BARCODE, DESCRIPTION, ENCODED_BY
			)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`;
		const [result] = await pool.execute(query, [
			data.BRANCH_ID,
			data.CATEGORY_NAME || null,
			data.MATERIAL_NAME,
			data.UNIT || null,
			InventoryModel.normalizeStatus(data.STATUS),
			Number(data.STOCK || 0),
			Number(data.UNIT_COST || 0),
			data.SKU || null,
			data.BARCODE || null,
			data.DESCRIPTION || null,
			data.user_id || null,
		]);
		return result.insertId;
	}

	static async updateMaterial(id, data) {
		await InventoryModel.ensureSchema();
		const query = `
			UPDATE inventory_materials SET
				CATEGORY_NAME = ?,
				MATERIAL_NAME = ?,
				UNIT = ?,
				STATUS = ?,
				STOCK = ?,
				UNIT_COST = ?,
				SKU = ?,
				BARCODE = ?,
				DESCRIPTION = ?,
				EDITED_BY = ?,
				EDITED_DT = CURRENT_TIMESTAMP
			WHERE IDNo = ? AND ACTIVE = 1
		`;
		const [result] = await pool.execute(query, [
			data.CATEGORY_NAME || null,
			data.MATERIAL_NAME,
			data.UNIT || null,
			InventoryModel.normalizeStatus(data.STATUS),
			Number(data.STOCK || 0),
			Number(data.UNIT_COST || 0),
			data.SKU || null,
			data.BARCODE || null,
			data.DESCRIPTION || null,
			data.user_id || null,
			id,
		]);
		return result.affectedRows > 0;
	}

	static async deleteMaterial(id, userId) {
		await InventoryModel.ensureSchema();
		const [result] = await pool.execute(
			`UPDATE inventory_materials SET ACTIVE = 0, EDITED_BY = ?, EDITED_DT = CURRENT_TIMESTAMP WHERE IDNo = ?`,
			[userId || null, id]
		);
		return result.affectedRows > 0;
	}

	static async getMappingsByMenuIds(menuIds) {
		await InventoryModel.ensureSchema();
		if (!Array.isArray(menuIds) || menuIds.length === 0) return [];
		const placeholders = menuIds.map(() => '?').join(',');
		const [rows] = await pool.execute(
			`
			SELECT
				mim.IDNo,
				mim.MENU_ID,
				mim.PRODUCT_ID,
				mim.MATERIAL_ID,
				mim.QUANTITY,
				p.PRODUCT_NAME,
				p.STOCK AS PRODUCT_STOCK,
				p.STATUS AS PRODUCT_STATUS,
				mt.MATERIAL_NAME,
				mt.STOCK AS MATERIAL_STOCK,
				mt.STATUS AS MATERIAL_STATUS
			FROM menu_inventory_map mim
			LEFT JOIN inventory_products p ON p.IDNo = mim.PRODUCT_ID AND p.ACTIVE = 1
			LEFT JOIN inventory_materials mt ON mt.IDNo = mim.MATERIAL_ID AND mt.ACTIVE = 1
			WHERE mim.ACTIVE = 1 AND mim.MENU_ID IN (${placeholders})
			`,
			menuIds
		);
		return rows;
	}

	static async replaceMenuMappings(menuId, mappings, userId, connection = null) {
		await InventoryModel.ensureSchema();
		const conn = connection || (await pool.getConnection());
		const managed = !connection;
		try {
			if (managed) await conn.beginTransaction();
			await conn.execute(`UPDATE menu_inventory_map SET ACTIVE = 0, EDITED_BY = ?, EDITED_DT = CURRENT_TIMESTAMP WHERE MENU_ID = ?`, [userId || null, menuId]);

			if (Array.isArray(mappings) && mappings.length > 0) {
				const values = mappings.map((mapping) => [
					menuId,
					mapping.product_id || null,
					mapping.material_id || null,
					Number(mapping.quantity || 0),
					1,
					userId || null,
					new Date(),
				]);
				await conn.query(
					`
					INSERT INTO menu_inventory_map
						(MENU_ID, PRODUCT_ID, MATERIAL_ID, QUANTITY, ACTIVE, ENCODED_BY, ENCODED_DT)
					VALUES ?
					`,
					[values]
				);
			}
			if (managed) await conn.commit();
		} catch (error) {
			if (managed) await conn.rollback();
			throw error;
		} finally {
			if (managed) conn.release();
		}
	}

	static calculateMenuInventoryMetrics(menus, mappings) {
		const grouped = new Map();
		for (const row of mappings) {
			if (!grouped.has(row.MENU_ID)) grouped.set(row.MENU_ID, []);
			grouped.get(row.MENU_ID).push(row);
		}

		return menus.map((menu) => {
			const deps = grouped.get(menu.IDNo) || [];
			if (deps.length === 0) {
				return {
					...menu,
					INVENTORY_TRACKED: 0,
					INVENTORY_AVAILABLE: 1,
					INVENTORY_STOCK: null,
				};
			}

			let minStock = Number.POSITIVE_INFINITY;
			let valid = true;
			for (const dep of deps) {
				const qtyPerMenu = Number(dep.QUANTITY || 0);
				if (!Number.isFinite(qtyPerMenu) || qtyPerMenu <= 0) {
					valid = false;
					break;
				}

				if (dep.PRODUCT_ID) {
					if (dep.PRODUCT_STOCK === null || dep.PRODUCT_STOCK === undefined || dep.PRODUCT_STATUS !== STATUS_ACTIVE) {
						valid = false;
						break;
					}
					minStock = Math.min(minStock, Number(dep.PRODUCT_STOCK) / qtyPerMenu);
				} else if (dep.MATERIAL_ID) {
					if (dep.MATERIAL_STOCK === null || dep.MATERIAL_STOCK === undefined || dep.MATERIAL_STATUS !== STATUS_ACTIVE) {
						valid = false;
						break;
					}
					minStock = Math.min(minStock, Number(dep.MATERIAL_STOCK) / qtyPerMenu);
				} else {
					valid = false;
					break;
				}
			}

			if (!valid || !Number.isFinite(minStock)) {
				return {
					...menu,
					INVENTORY_TRACKED: 1,
					INVENTORY_AVAILABLE: 0,
					INVENTORY_STOCK: 0,
				};
			}

			return {
				...menu,
				INVENTORY_TRACKED: 1,
				INVENTORY_AVAILABLE: minStock >= 1 ? 1 : 0,
				INVENTORY_STOCK: Number(minStock.toFixed(3)),
			};
		});
	}
}

module.exports = InventoryModel;
