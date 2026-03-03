// controllers/accountController.js
const Account = require('../models/accountModel');

exports.getAccounts = async (req, res) => {
  try {
    const data = await Account.getAll();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addAccount = async (req, res) => {
  try {
    const { email, password } = req.body; // ← Chỉ cần email + password

    if (!email || !password) {
      return res.status(400).json({ error: 'Email và password là bắt buộc' });
    }

    // Kiểm tra email đã tồn tại chưa
    const existing = await Account.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email đã được đăng ký' });
    }

    const newAccount = await Account.create({ email, password });

    res.status(201).json({
      message: 'Tạo tài khoản thành công',
      account: {
        id_account: newAccount.id_account,
        email: newAccount.email,
        created_at: newAccount.created_at,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi tạo tài khoản' });
  }
};