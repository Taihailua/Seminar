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
      const client = await pool.connect();

      try {
          await client.query('BEGIN');

          // 1. Update scan_history (cập nhật thời gian và cộng thêm token_used)
          const scanResult = await client.query(
              `UPDATE scan_history 
              SET scan_time = CURRENT_TIMESTAMP,
                  token_used = token_used + $3
              WHERE id_user = $1 AND id_restaurant = $2
              RETURNING id_user, id_restaurant, scan_time, token_used`,
              [id_user, id_restaurant, token_used]
          );

          // Nếu không tìm thấy record scan_history nào thì không cần trừ token
          if (scanResult.rowCount === 0) {
              await client.query('ROLLBACK');
              return null;
          }

          // 2. Trừ token_balance của user
          const userResult = await client.query(
              `UPDATE users 
              SET token_balance = token_balance - $1
              WHERE id_user = $2 
                AND token_balance >= $1        -- Ngăn token bị âm
              RETURNING id_user, token_balance`,
              [token_used, id_user]
          );

          await client.query('COMMIT');

          return {
              scan: scanResult.rows[0],
              remaining_tokens: userResult.rows[0]?.token_balance || null,
              success: true
          };

      } catch (error) {
          await client.query('ROLLBACK');
          console.error('Error updating scan:', error);
          throw error;
      } finally {
          client.release();
      }
  },

    insert: async (id_user, id_restaurant, token_used = 50) => {
      // 1. Insert scan trước
      const scanResult = await pool.query(
          `INSERT INTO scan_history (id_user, id_restaurant, scan_time, token_used)
          VALUES ($1, $2, CURRENT_TIMESTAMP, $3)
          RETURNING *`,
          [id_user, id_restaurant, token_used]
      );

      // 2. Trừ token sau (không kiểm tra đủ token để test)
      const updateResult = await pool.query(
          `UPDATE users 
          SET token_balance = token_balance - $1 
          WHERE id_user = $2 
          RETURNING id_user, token_balance`,
          [token_used, id_user]
      );

      console.log("Scan inserted:", scanResult.rows[0]);
      console.log("Rows affected by UPDATE:", updateResult.rowCount);
      console.log("New token balance:", updateResult.rows[0]?.token_balance);

      return {
          scan: scanResult.rows[0],
          remaining_tokens: updateResult.rows[0]?.token_balance
      };
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