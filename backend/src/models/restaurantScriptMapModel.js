const pool = require('../config/db');

const RestaurantScriptMap = {
  // Tạo mapping khi tạo script (được gọi từ Script model)
  createMapping: async (id_restaurant, id_script) => {
    const result = await pool.query(
      `INSERT INTO restaurant_script_map (id_restaurant, id_script, is_active)
       VALUES ($1, $2, false)
       ON CONFLICT (id_restaurant, id_script) DO NOTHING
       RETURNING id_restaurant, id_script, is_active`,
      [id_restaurant, id_script]
    );
    return result.rows[0];
  },

  // Lấy thông tin mapping theo id_restaurant và id_script
  getByRestaurantAndScript: async (id_restaurant, id_script) => {
    const result = await pool.query(
      `SELECT 
         rsm.id_restaurant,
         rsm.id_script,
         rsm.is_active,
         s.content,
         s.created_at,
         s.status
       FROM restaurant_script_map rsm
       JOIN scripts s ON rsm.id_script = s.id_script
       WHERE rsm.id_restaurant = $1 
         AND rsm.id_script = $2`,
      [id_restaurant, id_script]
    );

    return result.rows[0] || null;
  },

  // Cập nhật is_active
  updateIsActive: async (id_restaurant, id_script, is_active) => {
    const result = await pool.query(
      `UPDATE restaurant_script_map 
       SET is_active = $1
       WHERE id_restaurant = $2 
         AND id_script = $3 
       RETURNING id_restaurant, id_script, is_active`,
      [is_active, id_restaurant, id_script]
    );

    return result.rows[0] || null;
  },

  // Lấy tất cả script của một nhà hàng
  getScriptsByRestaurant: async (id_restaurant) => {
    const result = await pool.query(
      `SELECT 
         rsm.id_script,
         rsm.is_active,
         s.content,
         s.created_at,
         s.status
       FROM restaurant_script_map rsm
       JOIN scripts s ON rsm.id_script = s.id_script
       WHERE rsm.id_restaurant = $1
       ORDER BY s.created_at DESC`,
      [id_restaurant]
    );
    return result.rows;
  }
};

module.exports = RestaurantScriptMap;