// models/menuItemModel.js
const pool = require('../config/db');

const MenuItem = {
  // Tạo món ăn mới (bắt buộc phải có id_restaurant)
  create: async ({ id_restaurant, name, description, price, image_url }) => {
    if (!id_restaurant) {
      throw new Error('id_restaurant là bắt buộc');
    }

    const result = await pool.query(
      `INSERT INTO menu_items (id_restaurant, name, description, price, image_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_menu_item, id_restaurant, name, description, price, image_url, status, created_at`,
      [id_restaurant, name, description || null, price || null, image_url || null]
    );
    return result.rows[0];
  },

  // Lấy tất cả món ăn (có thể lọc theo nhà hàng)
  getAll: async (id_restaurant = null) => {
    if (id_restaurant) {
      const result = await pool.query(
        `SELECT * FROM menu_items 
         WHERE id_restaurant = $1 
           AND status != 'deleted'
         ORDER BY created_at DESC`,
        [id_restaurant]
      );
      return result.rows;
    }

    const result = await pool.query(
      `SELECT * FROM menu_items 
       WHERE status != 'deleted' 
       ORDER BY created_at DESC`
    );
    return result.rows;
  },

  // Lấy món ăn theo ID
  findById: async (id_menu_item) => {
    const result = await pool.query(
      `SELECT * FROM menu_items WHERE id_menu_item = $1`,
      [id_menu_item]
    );
    return result.rows[0] || null;
  },

  // Cập nhật món ăn
  update: async (id_menu_item, { name, description, price, image_url, status }) => {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(name);
      paramIndex++;
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      values.push(description);
      paramIndex++;
    }
    if (price !== undefined) {
      updates.push(`price = $${paramIndex}`);
      values.push(price);
      paramIndex++;
    }
    if (image_url !== undefined) {
      updates.push(`image_url = $${paramIndex}`);
      values.push(image_url);
      paramIndex++;
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (updates.length === 0) {
      return await MenuItem.findById(id_menu_item);
    }

    values.push(id_menu_item);

    const query = `
      UPDATE menu_items
      SET ${updates.join(', ')}
      WHERE id_menu_item = $${paramIndex}
      RETURNING id_menu_item, id_restaurant, name, description, price, image_url, status, created_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  },

  // Xóa mềm (soft delete)
  softDelete: async (id_menu_item) => {
    const result = await pool.query(
      `UPDATE menu_items 
       SET status = 'unavailable'
       WHERE id_menu_item = $1 
       RETURNING id_menu_item, name, status`,
      [id_menu_item]
    );
    return result.rows[0] || null;
  }
};

module.exports = MenuItem;