// models/authModel.js
const pool = require('../config/db');

const Auth = {
  findByEmail: async (email) => {
    const result = await pool.query(
      `SELECT a.*, u.name, u.avatar_url, u.token_balance, u.status, u.language, u.id_user
       FROM accounts a 
       LEFT JOIN users u ON a.id_account = u.id_account 
       WHERE a.email = $1`,
      [email]
    );
    return result.rows[0] || null;
  },

  findByUsername: async (username) => {
    const result = await pool.query(
      `SELECT a.*, u.name, u.avatar_url, u.token_balance, u.status, u.language, u.id_user
       FROM accounts a 
       JOIN users u ON a.id_account = u.id_account 
       WHERE u.name = $1`,
      [username]
    );
    return result.rows[0] || null;
  },

  register: async ({ email, password_hash, name, avatar_url, language }) => {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const accountResult = await client.query(
        `INSERT INTO accounts (email, password_hash, role)
         VALUES ($1, $2, 'user') 
         RETURNING id_account, email, role, created_at`,
        [email, password_hash]
      );

      const newAccount = accountResult.rows[0];

      const userResult = await client.query(
        `INSERT INTO users (id_account, name, avatar_url, language, token_balance, status)
         VALUES ($1, $2, $3, $4, 999, 'active')
         RETURNING id_user, name, avatar_url, language, token_balance, status`,
        [
          newAccount.id_account,
          name || null,
          avatar_url || null,
          language || 'vi'
        ]
      );

      await client.query('COMMIT');

      return {
        account: newAccount,
        user: userResult.rows[0]
      };

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  authenticate: async (identifier, password) => {
    // Tìm theo email trước
    let user = await Auth.findByEmail(identifier);
    
    // Nếu không tìm thấy thì thử theo username
    if (!user) {
      user = await Auth.findByUsername(identifier);
    }

    if (!user) {
      return null; // Không tìm thấy user
    }

    // So sánh mật khẩu (sau này nên thay bằng bcrypt.compare)
    if (password !== user.password_hash) {
      return null; // Sai mật khẩu
    }
    console.log(user);
    return user;
  },

  // ==================== THÊM HÀM UPDATE ROLE ====================
  updateRole: async (id_user, newRole) => {   // ← đổi tham số thành id_user
    const validRoles = ['user', 'admin', 'owner'];
    
    if (!validRoles.includes(newRole)) {
      throw new Error('Role không hợp lệ. Chỉ chấp nhận: user, admin, owner');
    }

    // Join users với accounts để lấy id_account từ id_user
    const result = await pool.query(
      `UPDATE accounts 
      SET role = $1 
      FROM users 
      WHERE accounts.id_account = users.id_account 
        AND users.id_user = $2 
      RETURNING accounts.id_account, accounts.email, accounts.role, accounts.created_at`,
      [newRole, id_user]
    );

    if (result.rowCount === 0) {
      throw new Error('Không tìm thấy user với id_user này');
    }

    return result.rows[0];
  },
};

module.exports = Auth;