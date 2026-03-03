// controllers/authController.js
const { validationResult } = require('express-validator');
const Account = require('../models/accountModel');

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {email, password} = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    const existingByEmail = await Account.findByEmail(email);
    if (existingByEmail) {
      return res.status(409).json({ message: 'Email đã được sử dụng' });
    }


    const newUser = await Account.create({email, password});

    // Trả về thông tin user, KHÔNG có token
    res.status(201).json({
      message: 'Đăng ký thành công',
      user: {
        id: newUser.id_account,
        email: newUser.email,
        created_at: newUser.created_at,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi đăng ký' });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Thiếu thông tin đăng nhập' });
    }

    let user = await Account.findByEmail(identifier);
    if (!user) {
      user = await Account.findByUsername(identifier);
    }

    if (!user) {
      return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không đúng' });
    }

    // So sánh trực tiếp (plaintext)
    if (password !== user.password_hash) {
      return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không đúng' });
    }

    // Trả về thông tin user, KHÔNG có token
    res.json({
      message: 'Đăng nhập thành công',
      user: {
        id: user.id_account,
        username: user.username,
        email: user.email,
        created_at: user.created_at,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi đăng nhập' });
  }
};

module.exports = { register, login };