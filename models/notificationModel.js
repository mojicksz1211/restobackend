// ============================================
// NOTIFICATION MODEL
// ============================================
// File: models/notificationModel.js
// Description: Database operations for notifications
// ============================================

const pool = require('../config/db');

class NotificationModel {
	// Create notification
	static async create(data) {
		const {
			user_id,
			title,
			message,
			type = 'info',
			link = null
		} = data;

		const query = `
			INSERT INTO notifications (
				USER_ID,
				TITLE,
				MESSAGE,
				TYPE,
				LINK,
				IS_READ,
				CREATED_DT
			) VALUES (?, ?, ?, ?, ?, 0, ?)
		`;

		await pool.execute(query, [
			user_id,
			title,
			message,
			type,
			link,
			new Date()
		]);
	}

	// Get user notifications
	static async getByUserId(userId, unreadOnly = false, limit = 50) {
		let query = `
			SELECT 
				IDNo,
				USER_ID,
				TITLE,
				MESSAGE,
				TYPE,
				LINK,
				IS_READ,
				CREATED_DT
			FROM notifications
			WHERE USER_ID = ?
		`;

		const params = [userId];

		if (unreadOnly) {
			query += ` AND IS_READ = 0`;
		}

		query += ` ORDER BY CREATED_DT DESC LIMIT ?`;
		params.push(limit);

		const [rows] = await pool.execute(query, params);
		return rows;
	}

	// Mark notification as read
	static async markAsRead(notificationId, userId) {
		const query = `
			UPDATE notifications 
			SET IS_READ = 1 
			WHERE IDNo = ? AND USER_ID = ?
		`;
		const [result] = await pool.execute(query, [notificationId, userId]);
		return result.affectedRows > 0;
	}

	// Mark all notifications as read for user
	static async markAllAsRead(userId) {
		const query = `
			UPDATE notifications 
			SET IS_READ = 1 
			WHERE USER_ID = ? AND IS_READ = 0
		`;
		await pool.execute(query, [userId]);
		return true;
	}

	// Clear all notifications for user
	static async clearAll(userId) {
		const query = `DELETE FROM notifications WHERE USER_ID = ?`;
		await pool.execute(query, [userId]);
		return true;
	}

	// Get unread count
	static async getUnreadCount(userId) {
		const query = `
			SELECT COUNT(*) as count
			FROM notifications
			WHERE USER_ID = ? AND IS_READ = 0
		`;
		const [rows] = await pool.execute(query, [userId]);
		return parseInt(rows[0]?.count || 0);
	}
}

module.exports = NotificationModel;

