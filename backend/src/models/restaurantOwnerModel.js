// models/restaurantOwnerModel.js
const pool = require('../config/db');

const RestaurantOwner = {
  // Lấy tất cả mối quan hệ owner - restaurant
  getAll: async () => {
    const result = await pool.query(
      `SELECT id_user, id_restaurant
       FROM restaurant_owners
       ORDER BY id_user, id_restaurant`
    );
    return result.rows;
  },

  // Lấy một mối quan hệ cụ thể theo id_user và id_restaurant
  getById: async (id_user, id_restaurant) => {
    const result = await pool.query(
      `SELECT id_user, id_restaurant
       FROM restaurant_owners
       WHERE id_user = $1 AND id_restaurant = $2`,
      [id_user, id_restaurant]
    );
    return result.rows[0] || null;
  },

  // (Tùy chọn - nếu sau này cần) Kiểm tra xem user có sở hữu restaurant này không
  exists: async (id_user, id_restaurant) => {
    const result = await pool.query(
      `SELECT 1 FROM restaurant_owners
       WHERE id_user = $1 AND id_restaurant = $2`,
      [id_user, id_restaurant]
    );
    return result.rowCount > 0;
  },

  // (Tùy chọn) Thêm owner cho restaurant
  create: async (id_user, id_restaurant) => {
    const result = await pool.query(
      `INSERT INTO restaurant_owners (id_user, id_restaurant)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING
       RETURNING id_user, id_restaurant`,
      [id_user, id_restaurant]
    );
    return result.rows[0] || null;
  },

  // (Tùy chọn) Xóa owner khỏi restaurant
  delete: async (id_user, id_restaurant) => {
    const result = await pool.query(
      `DELETE FROM restaurant_owners
       WHERE id_user = $1 AND id_restaurant = $2
       RETURNING id_user, id_restaurant`,
      [id_user, id_restaurant]
    );
    return result.rowCount > 0;
  }
};

module.exports = RestaurantOwner;