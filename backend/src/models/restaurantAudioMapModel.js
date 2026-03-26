const pool = require('../config/db');

const RestaurantAudioMap = {
  // Lấy tất cả mối quan hệ nhà hàng - audio
  getAll: async () => {
    const result = await pool.query(
      `SELECT id_restaurant, id_audio
       FROM restaurant_audio_map
       ORDER BY id_restaurant, id_audio`
    );
    return result.rows;
  },

  // Lấy một mối quan hệ cụ thể theo id_restaurant và id_audio
  getById: async (id_restaurant, id_audio) => {
    const result = await pool.query(
      `SELECT id_restaurant, id_audio
       FROM restaurant_audio_map
       WHERE id_restaurant = $1 AND id_audio = $2`,
      [id_restaurant, id_audio]
    );
    return result.rows[0] || null;
  },

  // Kiểm tra tồn tại (rất hữu ích khi cần validate trước khi thêm/xóa)
  exists: async (id_restaurant, id_audio) => {
    const result = await pool.query(
      `SELECT 1 FROM restaurant_audio_map
       WHERE id_restaurant = $1 AND id_audio = $2`,
      [id_restaurant, id_audio]
    );
    return result.rowCount > 0;
  },

  // (Tùy chọn – nếu sau này cần) Thêm mapping
  create: async (id_restaurant, id_audio) => {
    const result = await pool.query(
      `INSERT INTO restaurant_audio_map (id_restaurant, id_audio)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING
       RETURNING id_restaurant, id_audio`,
      [id_restaurant, id_audio]
    );
    return result.rows[0] || null;
  },

  // (Tùy chọn) Xóa mapping
  delete: async (id_restaurant, id_audio) => {
    const result = await pool.query(
      `DELETE FROM restaurant_audio_map
       WHERE id_restaurant = $1 AND id_audio = $2
       RETURNING id_restaurant, id_audio`,
      [id_restaurant, id_audio]
    );
    return result.rowCount > 0;
  }
};

module.exports = RestaurantAudioMap;