const InventoryModel = require('../models/inventoryModel');
const ApiResponse = require('../utils/apiResponse');

function resolveBranchId(req) {
	const raw = req.session?.branch_id || req.query.branch_id || req.body?.branch_id || req.body?.BRANCH_ID || req.user?.branch_id || null;
	if (raw === null || raw === undefined || raw === '' || raw === 'all') return null;
	const parsed = Number(raw);
	return Number.isFinite(parsed) ? parsed : null;
}

class InventoryController {
	static async getProducts(req, res) {
		try {
			const branchId = resolveBranchId(req);
			const rows = await InventoryModel.getProducts(branchId);
			return ApiResponse.success(res, rows, 'Products retrieved successfully');
		} catch (error) {
			return ApiResponse.error(res, 'Failed to fetch products', 500, error.message);
		}
	}

	static async createProduct(req, res) {
		try {
			const branchId = resolveBranchId(req);
			if (!branchId) return ApiResponse.badRequest(res, 'Branch ID is required');
			const userId = req.session?.user_id || req.user?.user_id || null;
			const id = await InventoryModel.createProduct({
				BRANCH_ID: branchId,
				CATEGORY_NAME: req.body.CATEGORY_NAME || req.body.category,
				PRODUCT_NAME: req.body.PRODUCT_NAME || req.body.name,
				UNIT: req.body.UNIT || req.body.unit,
				TYPE: req.body.TYPE || req.body.type,
				STATUS: req.body.STATUS || req.body.status,
				PRICE: req.body.PRICE ?? req.body.price,
				STOCK: req.body.STOCK ?? req.body.stock,
				SKU: req.body.SKU || req.body.sku,
				BARCODE: req.body.BARCODE || req.body.barcode,
				DESCRIPTION: req.body.DESCRIPTION || req.body.description,
				user_id: userId,
			});
			return ApiResponse.created(res, { id }, 'Product created successfully');
		} catch (error) {
			return ApiResponse.error(res, 'Failed to create product', 500, error.message);
		}
	}

	static async updateProduct(req, res) {
		try {
			const { id } = req.params;
			const userId = req.session?.user_id || req.user?.user_id || null;
			const ok = await InventoryModel.updateProduct(id, {
				CATEGORY_NAME: req.body.CATEGORY_NAME || req.body.category,
				PRODUCT_NAME: req.body.PRODUCT_NAME || req.body.name,
				UNIT: req.body.UNIT || req.body.unit,
				TYPE: req.body.TYPE || req.body.type,
				STATUS: req.body.STATUS || req.body.status,
				PRICE: req.body.PRICE ?? req.body.price,
				STOCK: req.body.STOCK ?? req.body.stock,
				SKU: req.body.SKU || req.body.sku,
				BARCODE: req.body.BARCODE || req.body.barcode,
				DESCRIPTION: req.body.DESCRIPTION || req.body.description,
				user_id: userId,
			});
			if (!ok) return ApiResponse.notFound(res, 'Product');
			return ApiResponse.success(res, null, 'Product updated successfully');
		} catch (error) {
			return ApiResponse.error(res, 'Failed to update product', 500, error.message);
		}
	}

	static async deleteProduct(req, res) {
		try {
			const { id } = req.params;
			const userId = req.session?.user_id || req.user?.user_id || null;
			const ok = await InventoryModel.deleteProduct(id, userId);
			if (!ok) return ApiResponse.notFound(res, 'Product');
			return ApiResponse.success(res, null, 'Product deleted successfully');
		} catch (error) {
			return ApiResponse.error(res, 'Failed to delete product', 500, error.message);
		}
	}

	static async getMaterials(req, res) {
		try {
			const branchId = resolveBranchId(req);
			const rows = await InventoryModel.getMaterials(branchId);
			return ApiResponse.success(res, rows, 'Materials retrieved successfully');
		} catch (error) {
			return ApiResponse.error(res, 'Failed to fetch materials', 500, error.message);
		}
	}

	static async createMaterial(req, res) {
		try {
			const branchId = resolveBranchId(req);
			if (!branchId) return ApiResponse.badRequest(res, 'Branch ID is required');
			const userId = req.session?.user_id || req.user?.user_id || null;
			const id = await InventoryModel.createMaterial({
				BRANCH_ID: branchId,
				CATEGORY_NAME: req.body.CATEGORY_NAME || req.body.category,
				MATERIAL_NAME: req.body.MATERIAL_NAME || req.body.name,
				UNIT: req.body.UNIT || req.body.unit,
				STATUS: req.body.STATUS || req.body.status,
				STOCK: req.body.STOCK ?? req.body.stock,
				UNIT_COST: req.body.UNIT_COST ?? req.body.unitCost,
				SKU: req.body.SKU || req.body.sku,
				BARCODE: req.body.BARCODE || req.body.barcode,
				DESCRIPTION: req.body.DESCRIPTION || req.body.description,
				user_id: userId,
			});
			return ApiResponse.created(res, { id }, 'Material created successfully');
		} catch (error) {
			return ApiResponse.error(res, 'Failed to create material', 500, error.message);
		}
	}

	static async updateMaterial(req, res) {
		try {
			const { id } = req.params;
			const userId = req.session?.user_id || req.user?.user_id || null;
			const ok = await InventoryModel.updateMaterial(id, {
				CATEGORY_NAME: req.body.CATEGORY_NAME || req.body.category,
				MATERIAL_NAME: req.body.MATERIAL_NAME || req.body.name,
				UNIT: req.body.UNIT || req.body.unit,
				STATUS: req.body.STATUS || req.body.status,
				STOCK: req.body.STOCK ?? req.body.stock,
				UNIT_COST: req.body.UNIT_COST ?? req.body.unitCost,
				SKU: req.body.SKU || req.body.sku,
				BARCODE: req.body.BARCODE || req.body.barcode,
				DESCRIPTION: req.body.DESCRIPTION || req.body.description,
				user_id: userId,
			});
			if (!ok) return ApiResponse.notFound(res, 'Material');
			return ApiResponse.success(res, null, 'Material updated successfully');
		} catch (error) {
			return ApiResponse.error(res, 'Failed to update material', 500, error.message);
		}
	}

	static async deleteMaterial(req, res) {
		try {
			const { id } = req.params;
			const userId = req.session?.user_id || req.user?.user_id || null;
			const ok = await InventoryModel.deleteMaterial(id, userId);
			if (!ok) return ApiResponse.notFound(res, 'Material');
			return ApiResponse.success(res, null, 'Material deleted successfully');
		} catch (error) {
			return ApiResponse.error(res, 'Failed to delete material', 500, error.message);
		}
	}

	static async getMenuMappings(req, res) {
		try {
			const { menuId } = req.params;
			const rows = await InventoryModel.getMappingsByMenuIds([Number(menuId)]);
			const mapped = rows.map((row) => ({
				id: row.IDNo,
				menu_id: row.MENU_ID,
				product_id: row.PRODUCT_ID,
				material_id: row.MATERIAL_ID,
				quantity: Number(row.QUANTITY || 0),
			}));
			return ApiResponse.success(res, mapped, 'Menu mappings retrieved successfully');
		} catch (error) {
			return ApiResponse.error(res, 'Failed to fetch menu mappings', 500, error.message);
		}
	}

	static async saveMenuMappings(req, res) {
		try {
			const { menuId } = req.params;
			const userId = req.session?.user_id || req.user?.user_id || null;
			const raw = Array.isArray(req.body?.mappings) ? req.body.mappings : [];
			const cleaned = raw
				.map((row) => ({
					product_id: row.product_id ? Number(row.product_id) : null,
					material_id: row.material_id ? Number(row.material_id) : null,
					quantity: Number(row.quantity || 0),
				}))
				.filter((row) => (row.product_id || row.material_id) && row.quantity > 0);

			await InventoryModel.replaceMenuMappings(Number(menuId), cleaned, userId);
			return ApiResponse.success(res, null, 'Menu mappings updated successfully');
		} catch (error) {
			return ApiResponse.error(res, 'Failed to save menu mappings', 500, error.message);
		}
	}
}

module.exports = InventoryController;
