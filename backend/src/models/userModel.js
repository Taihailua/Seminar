// models/userModel.js
const pool = require('../config/db');

const User = {
  // Tìm user theo id_account (từ account đã login)
  findByAccountId: async (id_account) => {
    const result = await pool.query(
      'SELECT * FROM users WHERE id_account = $1',
      [id_account]
    );
    return result.rows[0] || null;
  },

  // Tạo user profile mới (gọi sau khi tạo account thành công)
  create: async ({ id_account, name = null, language = 'vi' }) => {
    const result = await pool.query(
      `INSERT INTO users (id_account, name, language, token_balance)
       VALUES ($1, $2, $3, 999)
       RETURNING id_user, id_account, name, language, token_balance, created_at`,
      [id_account, name, language]
    );
    return result.rows[0];
  },

  // Cập nhật thông tin (chỉ name và language, token_balance có thể thêm nếu cần)
  update: async (id_account, { name, language, avatar_url }) => {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(name);
      paramIndex++;
    }

    if (language !== undefined) {
      if (!['vi', 'en'].includes(language)) {
        throw new Error('Language chỉ được là "vi" hoặc "en"');
      }
      updates.push(`language = $${paramIndex}`);
      values.push(language);
      paramIndex++;
    }

    if (avatar_url !== undefined) {
      updates.push(`avatar_url = $${paramIndex}`);
      values.push(avatar_url);
      paramIndex++;
    }

    // Nếu không có gì để update thì trả về user hiện tại
    if (updates.length === 0) {
      return await User.findByAccountId(id_account);
    }

    values.push(id_account); // cho WHERE

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id_account = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  },

  // (Tùy chọn) Cập nhật token_balance riêng (ví dụ khi dùng token)
  updateTokenBalance: async (id_account, newBalance) => {
    if (typeof newBalance !== 'number' || newBalance < 0) {
      throw new Error('Token balance phải là số không âm');
    }
    const result = await pool.query(
      `UPDATE users
       SET token_balance = $1
       WHERE id_account = $2
       RETURNING token_balance`,
      [newBalance, id_account]
    );
    return result.rows[0]?.token_balance;
  },

  // ==================== THÊM HÀM XÓA MỀM ====================
  softDelete: async (id_account) => {
    const result = await pool.query(
      `UPDATE users 
       SET status = 'inactive' 
       WHERE id_account = $1 
       RETURNING id_user, id_account, name, avatar_url, status, language, token_balance, created_at`,
      [id_account]
    );

    if (result.rowCount === 0) {
      throw new Error('Không tìm thấy user với id_account này');
    }

    return result.rows[0];
  },

  updateInfo: async (id_account, { name, language }) => {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(name);
      paramIndex++;
    }

    if (language !== undefined) {
      if (!['vi', 'en'].includes(language)) {
        throw new Error('Language chỉ được là "vi" hoặc "en"');
      }
      updates.push(`language = $${paramIndex}`);
      values.push(language);
      paramIndex++;
    }

    if (updates.length === 0) {
      return await User.findByAccountId(id_account);
    }

    values.push(id_account);

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id_account = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  },

  updateAvatar: async (id_account, avatar_url) => {
    const result = await pool.query(
      `UPDATE users 
       SET avatar_url = $1 
       WHERE id_account = $2 
       RETURNING *`,
      [avatar_url, id_account]
    );
    return result.rows[0] || null;
  },

};

module.exports = User;