// controllers/userController.js
const User = require('../models/userModel');

const updateProfile = async (req, res) => {
  try {
    const { id_account, name, language } = req.body;

    if (!id_account) {
      return res.status(400).json({ message: 'Thiếu id_account' });
    }

    if (name === undefined && language === undefined) {
      return res.status(400).json({ message: 'Không có thông tin nào để cập nhật' });
    }

    const updatedUser = await User.update(id_account, { name, language });

    if (!updatedUser) {
      return res.status(404).json({ message: 'Không tìm thấy profile user' });
    }

    res.json({
      message: 'Cập nhật thông tin thành công',
      user: {
        id: updatedUser.id_user,
        name: updatedUser.name,
        language: updatedUser.language,
        token_balance: updatedUser.token_balance,
        created_at: updatedUser.created_at,
      },
    });
  } catch (err) {
    console.error(err);
    if (err.message?.includes('Language chỉ được là')) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Lỗi server khi cập nhật profile' });
  }
};

const getProfile = async (req, res) => {
  try {
    const { id_account } = req.params;  // ← LẤY TỪ URL: /profile/:id_account

    if (!id_account) {
      return res.status(400).json({ message: 'Thiếu id_account' });
    }

    const user = await User.findByAccountId(id_account);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy profile' });
    }

    res.json({
      user: {
        id: user.id_user,
        name: user.name,
        language: user.language,
        token_balance: user.token_balance,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = { updateProfile, getProfile };