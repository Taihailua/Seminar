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

  /**
   * Thêm hoặc cập nhật lịch sử quét (upsert)
   * - Nếu đã tồn tại → cập nhật scan_time và tăng token_used
   * - Nếu chưa → tạo mới với token_used = 0 hoặc giá trị truyền vào
   */
  upsert: async (id_user, id_restaurant, token_used = 0) => {
    const result = await pool.query(
      `INSERT INTO scan_history (id_user, id_restaurant, scan_time, token_used)
       VALUES ($1, $2, CURRENT_TIMESTAMP, $3)
       ON CONFLICT (id_user, id_restaurant)
       DO UPDATE SET
         scan_time = CURRENT_TIMESTAMP,
         token_used = scan_history.token_used + $3
       RETURNING id_user, id_restaurant, scan_time, token_used`,
      [id_user, id_restaurant, token_used]
    );
    return result.rows[0] || null;
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