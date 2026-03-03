// models/restaurantMenuItemModel.js
const pool = require('../config/db');

const RestaurantMenuItem = {
  // Lấy tất cả mối quan hệ nhà hàng - món ăn
  getAll: async () => {
    const result = await pool.query(
      `SELECT id_restaurant, id_menu_item
       FROM restaurant_menu_items
       ORDER BY id_restaurant, id_menu_item`
    );
    return result.rows;
  },

  // Lấy một mối quan hệ cụ thể theo id_restaurant và id_menu_item
  getById: async (id_restaurant, id_menu_item) => {
    const result = await pool.query(
      `SELECT id_restaurant, id_menu_item
       FROM restaurant_menu_items
       WHERE id_restaurant = $1 AND id_menu_item = $2`,
      [id_restaurant, id_menu_item]
    );
    return result.rows[0] || null;
  },

  // (Tùy chọn - nếu sau này cần) Kiểm tra xem nhà hàng có món ăn này không
  exists: async (id_restaurant, id_menu_item) => {
    const result = await pool.query(
      `SELECT 1 FROM restaurant_menu_items
       WHERE id_restaurant = $1 AND id_menu_item = $2`,
      [id_restaurant, id_menu_item]
    );
    return result.rowCount > 0;
  },

  // (Tùy chọn) Thêm món ăn vào menu của nhà hàng
  create: async (id_restaurant, id_menu_item) => {
    const result = await pool.query(
      `INSERT INTO restaurant_menu_items (id_restaurant, id_menu_item)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING
       RETURNING id_restaurant, id_menu_item`,
      [id_restaurant, id_menu_item]
    );
    return result.rows[0] || null;
  },

  // (Tùy chọn) Xóa món ăn khỏi menu của nhà hàng
  delete: async (id_restaurant, id_menu_item) => {
    const result = await pool.query(
      `DELETE FROM restaurant_menu_items
       WHERE id_restaurant = $1 AND id_menu_item = $2
       RETURNING id_restaurant, id_menu_item`,
      [id_restaurant, id_menu_item]
    );
    return result.rowCount > 0;
  }
};

module.exports = RestaurantMenuItem;