// models/accountModel.js
const pool = require('../config/db');
const User = require('./userModel'); // Import User để gọi create

const Account = {
  getAll: async () => {
    const result = await pool.query('SELECT * FROM accounts');
    return result.rows;
  },

  findByEmail: async (email) => {
    const result = await pool.query(
      'SELECT * FROM accounts WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  },

  create: async ({ email, password}) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Bước 1: Tạo account trước
      const accountResult = await client.query(
        `INSERT INTO accounts (email, password_hash)
         VALUES ($1, $2)
         RETURNING id_account, email, created_at`,
        [email, password] // Nên hash password trước khi lưu (xem lưu ý dưới)
      );

      const newAccount = accountResult.rows[0];

      // Bước 2: Dùng id_account vừa tạo để tạo user profile mặc định
      // name = null, language = 'vi', token_balance = 999
      await client.query(
        `INSERT INTO users (id_account, name, language, token_balance)
         VALUES ($1, $2, $3, $4)
         RETURNING id_user, id_account, name, language, token_balance, created_at`,
        [newAccount.id_account, null, 'vi', 999]
      );

      await client.query('COMMIT');

      // Trả về thông tin account (không cần trả user vì frontend có thể gọi API riêng để lấy profile)
      return newAccount;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};

module.exports = Account;