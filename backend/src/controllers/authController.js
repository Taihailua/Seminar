// controllers/authController.js
const Auth = require('../models/authModel');
const fs = require('fs').promises;
const path = require('path');

// --- avatar mặc định nếu user không upload ---
const DEFAULT_AVATAR = '/uploads/avatars/anh_mac_dinh.jpg';

const register = async (req, res) => {
  try {
    const { email, password, name, language } = req.body;

    // Lấy file từ multer, nếu không có thì dùng avatar mặc định
    const avatar_url = req.file
      ? `/uploads/avatars/${req.file.filename}`
      : DEFAULT_AVATAR;

    // Kiểm tra dữ liệu bắt buộc
    if (!email || !password || !name || !language) {
      // Xóa file nếu đã upload
      if (req.file) await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({
        message: 'Thiếu thông tin: email, password, name, language'
      });
    }

    // Gọi model đăng ký
    const result = await Auth.register({
      email,
      password_hash: password,
      name,
      avatar_url,
      language
    });

    res.status(201).json({
      message: 'Đăng ký thành công',
      user: {
        id: result.account.id_account,
        email: result.account.email,
        name: result.user.name,
        avatar_url: result.user.avatar_url,
        language: result.user.language,
        token_balance: result.user.token_balance,
        status: result.user.status,
        role: result.account.role,
        created_at: result.account.created_at,
      }
    });
  } catch (err) {
    console.error('Register error:', err);

    // Xóa file nếu upload nhưng có lỗi
    if (req.file) await fs.unlink(req.file.path).catch(() => {});

    res.status(500).json({ message: 'Lỗi server khi đăng ký' });
  }
};

const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Thiếu thông tin đăng nhập' });
    }

    const user = await Auth.authenticate(identifier, password);

    if (!user) {
      return res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' });
    }   

    res.json({
      message: 'Đăng nhập thành công',
      user: {
        id_account: user.id_account,
        id_user: user.id_user,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url || DEFAULT_AVATAR,
        language: user.language,
        token_balance: user.token_balance,
        status: user.status,
        role: user.role,
        created_at: user.created_at,
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Lỗi server khi đăng nhập' });
  }
};

// ==================== THÊM HÀM UPDATE ROLE ====================
const updateRole = async (req, res) => {
  try {
    const { id_account } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ message: 'Vui lòng gửi role mới' });
    }

    const updated = await Auth.updateRole(id_account, role);

    res.json({
      message: 'Cập nhật role thành công',
      account: updated
    });
  } catch (err) {
    console.error('Update role error:', err);
    
    if (err.message.includes('Role không hợp lệ')) {
      return res.status(400).json({ message: err.message });
    }
    if (err.message.includes('Không tìm thấy')) {
      return res.status(404).json({ message: err.message });
    }

    res.status(500).json({ message: 'Lỗi server khi cập nhật role' });
  }
};

module.exports = { register, login, updateRole };