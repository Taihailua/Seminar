const pool = require('../config/db');

const ScanHistory = {
  /**
   * Lấy tất cả lịch sử quét (toàn bộ bảng)
   * - Thường chỉ dùng cho admin hoặc debug
   */
  getAll: async () => {
    const result = await pool.query(
      `SELECT 
         id_user, 
         id_restaurant, 
         scan_time, 
         token_used
       FROM scan_history
       ORDER BY scan_time DESC`
    );
    return result.rows;
  },

  /**
   * Lấy một bản ghi cụ thể theo id_user + id_restaurant
   * → Kiểm tra xem user đã từng quét nhà hàng này chưa
   */
  getById: async (id_user, id_restaurant) => {
    const result = await pool.query(
      `SELECT 
         id_user, 
         id_restaurant, 
         scan_time, 
         token_used
       FROM scan_history
       WHERE id_user = $1 AND id_restaurant = $2`,
      [id_user, id_restaurant]
    );
    return result.rows[0] || null;
  },

  /**
   * Lấy toàn bộ lịch sử quét của một user (theo thời gian giảm dần)
   * → Thường dùng nhất trong thực tế
   */
  getByUserId: async (id_user, limit = 50) => {
    const result = await pool.query(
      `SELECT 
         id_user, 
         id_restaurant, 
         scan_time, 
         token_used
       FROM scan_history
       WHERE id_user = $1
       ORDER BY scan_time DESC
       LIMIT $2`,
      [id_user, limit]
    );
    return result.rows;
  },

  /**
   * Kiểm tra xem user đã từng quét nhà hàng này chưa
   */
  exists: async (id_user, id_restaurant) => {
    const result = await pool.query(
      `SELECT 1 FROM scan_history
       WHERE id_user = $1 AND id_restaurant = $2`,
      [id_user, id_restaurant]
    );
    return result.rowCount > 0;
  },

  update: async (id_user, id_restaurant, token_used = 50) => {
      const result = await pool.query(
        `UPDATE scan_history 
        SET scan_time = CURRENT_TIMESTAMP,
            token_used = token_used + $3
        WHERE id_user = $1 AND id_restaurant = $2
        RETURNING id_user, id_restaurant, scan_time, token_used`,
        [id_user, id_restaurant, token_used]
      );
      return result.rows[0] || null;
    },

    insert: async (id_user, id_restaurant, token_used = 50) => {
    const result = await pool.query(
      `INSERT INTO scan_history (id_user, id_restaurant, scan_time, token_used)
       VALUES ($1, $2, CURRENT_TIMESTAMP, $3)
       RETURNING id_user, id_restaurant, scan_time, token_used`,
      [id_user, id_restaurant, token_used]
    );
    return result.rows[0];
  },
  /**
   * (Tùy chọn) Xóa một bản ghi lịch sử cụ thể
   */
  delete: async (id_user, id_restaurant) => {
    const result = await pool.query(
      `DELETE FROM scan_history
       WHERE id_user = $1 AND id_restaurant = $2
       RETURNING id_user, id_restaurant`,
      [id_user, id_restaurant]
    );
    return result.rowCount > 0;
  }
};

module.exports = ScanHistory;