// models/scriptModel.js
const pool = require('../config/db');

const Script = {
  // Tạo mới script + liên kết với nhà hàng
  create: async ({ content, id_restaurant }) => {
    // Kiểm tra id_restaurant bắt buộc
    if (!id_restaurant) {
      throw new Error('id_restaurant là bắt buộc khi tạo script');
    }

    const result = await pool.query(
      `INSERT INTO scripts (content)
       VALUES ($1)
       RETURNING id_script, content, created_at, status`,
      [content]
    );

    const newScript = result.rows[0];

    // Tạo liên kết trong bảng restaurant_script_map
    await pool.query(
      `INSERT INTO restaurant_script_map (id_restaurant, id_script, is_active)
       VALUES ($1, $2, false)
       ON CONFLICT (id_restaurant, id_script) DO NOTHING`,
      [id_restaurant, newScript.id_script]
    );

    return newScript;
  },

  // Lấy tất cả script (chưa bị xóa)
  getAll: async () => {
    const result = await pool.query(
      `SELECT id_script, content, created_at, status
       FROM scripts 
       WHERE COALESCE(status, 'active') != 'deleted'
       ORDER BY created_at DESC`
    );
    return result.rows;
  },

  // Lấy script theo ID
  getById: async (id_script) => {
    const result = await pool.query(
      `SELECT id_script, content, created_at, status 
       FROM scripts 
       WHERE id_script = $1`,
      [id_script]
    );
    return result.rows[0] || null;
  },

  // Cập nhật script
  update: async (id_script, { content }) => {
    if (!content) {
      return await Script.getById(id_script);
    }

    const result = await pool.query(
      `UPDATE scripts 
       SET content = $1
       WHERE id_script = $2 
       RETURNING id_script, content, created_at, status`,
      [content, id_script]
    );

    return result.rows[0] || null;
  },

  // Xóa mềm script
  softDelete: async (id_script) => {
    const result = await pool.query(
      `UPDATE scripts 
       SET status = 'deleted'
       WHERE id_script = $1 
       RETURNING id_script, content, status`,
      [id_script]
    );

    return result.rows[0] || null;
  }
};

module.exports = Script;