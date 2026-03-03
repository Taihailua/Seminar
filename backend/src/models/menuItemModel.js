// models/menuItemModel.js
const pool = require('../config/db');

const MenuItem = {
  // Tạo mới món ăn
  create: async ({ name, description, price, image_url }) => {
    const result = await pool.query(
      `INSERT INTO menu_items (name, description, price, image_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id_menu_item, name, description, price, image_url, created_at`,
      [name, description || null, price || null, image_url || null]
    );
    return result.rows[0];
  },

  // Lấy theo ID
  findById: async (id_menu_item) => {
    const result = await pool.query(
      'SELECT * FROM menu_items WHERE id_menu_item = $1',
      [id_menu_item]
    );
    return result.rows[0] || null;
  },

  // Lấy tất cả món ăn
  getAll: async () => {
    const result = await pool.query(
      `SELECT id_menu_item, name, description, price, image_url, created_at 
       FROM menu_items 
       ORDER BY created_at DESC`
    );
    return result.rows;
  },

  // Cập nhật món ăn
  update: async (id_menu_item, { name, description, price, image_url }) => {
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

    if (updates.length === 0) {
      return await MenuItem.findById(id_menu_item);
    }

    values.push(id_menu_item);

    const query = `
      UPDATE menu_items
      SET ${updates.join(', ')}
      WHERE id_menu_item = $${paramIndex}
      RETURNING id_menu_item, name, description, price, image_url, created_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  },

  // (Tùy chọn) Xóa món ăn
  delete: async (id_menu_item) => {
    const result = await pool.query(
      'DELETE FROM menu_items WHERE id_menu_item = $1 RETURNING id_menu_item',
      [id_menu_item]
    );
    return result.rowCount > 0;
  }
};

module.exports = MenuItem;