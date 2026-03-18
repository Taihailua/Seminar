// controllers/userController.js
const User = require('../models/userModel');
const fs = require('fs').promises;

const updateProfile = async (req, res) => {
  try {
    const { id_account, name, language } = req.body;

    if (!id_account) {
      // Xóa file nếu có upload nhưng thiếu id_account
      if (req.file) await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ message: 'Thiếu id_account' });
    }

    if (name === undefined && language === undefined && !req.file) {
      // Xóa file nếu có upload nhưng không có dữ liệu nào cần cập nhật
      if (req.file) await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ message: 'Không có thông tin nào để cập nhật' });
    }

    // Chuẩn bị dữ liệu cập nhật
    const updateData = { name, language };
    if (req.file) {
      updateData.avatar_url = `/uploads/avatars/${req.file.filename}`;
    }

    const updatedUser = await User.update(id_account, updateData);

    if (!updatedUser) {
      // Xóa file nếu cập nhật thất bại
      if (req.file) await fs.unlink(req.file.path).catch(() => {});
      return res.status(404).json({ message: 'Không tìm thấy profile user' });
    }

    res.json({
      message: 'Cập nhật thông tin thành công',
      user: {
        id_user: updatedUser.id_user,
        id_account: updatedUser.id_account,
        name: updatedUser.name,
        avatar_url: updatedUser.avatar_url,
        status: updatedUser.status,
        language: updatedUser.language,
        token_balance: updatedUser.token_balance,
        created_at: updatedUser.created_at,
      },
    });
  } catch (err) {
    console.error(err);
    // Xóa file nếu có lỗi
    if (req.file) await fs.unlink(req.file.path).catch(() => {});

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
        id_user: user.id_user,
        id_account: user.id_account,
        name: user.name,
        avatar_url: user.avatar_url,
        status: user.status,
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

// ==================== THÊM HÀM XÓA MỀM ====================
const softDeleteUser = async (req, res) => {
  try {
    const { id_account } = req.params;

    if (!id_account) {
      return res.status(400).json({ message: 'Thiếu id_account' });
    }

    const deletedUser = await User.softDelete(id_account);

    res.json({
      message: 'Xóa mềm user thành công (status = inactive)',
      user: {
        id_user: deletedUser.id_user,
        id_account: deletedUser.id_account,
        name: deletedUser.name,
        avatar_url: deletedUser.avatar_url,
        status: deletedUser.status,
        language: deletedUser.language,
        token_balance: deletedUser.token_balance,
        created_at: deletedUser.created_at,
      },
    });
  } catch (err) {
    console.error(err);
    if (err.message.includes('Không tìm thấy user')) {
      return res.status(404).json({ message: err.message });
    }
    res.status(500).json({ message: 'Lỗi server khi xóa mềm user' });
  }
};

const updateUserInfo = async (req, res) => {
  try {
    const { id_account, name, language } = req.body;

    if (!id_account) {
      return res.status(400).json({ message: 'Thiếu id_account' });
    }

    if (name === undefined && language === undefined) {
      return res.status(400).json({ message: 'Không có thông tin nào để cập nhật' });
    }

    const updatedUser = await User.updateInfo(id_account, { name, language });

    if (!updatedUser) {
      return res.status(404).json({ message: 'Không tìm thấy profile user' });
    }

    res.json({
      message: 'Cập nhật thông tin thành công',
      user: {
        id_user: updatedUser.id_user,
        id_account: updatedUser.id_account,
        name: updatedUser.name,
        avatar_url: updatedUser.avatar_url,
        status: updatedUser.status,
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
    res.status(500).json({ message: 'Lỗi server khi cập nhật thông tin' });
  }
};

const updateAvatar = async (req, res) => {
  try {
    const { id_account } = req.body;

    if (!id_account) {
      if (req.file) await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ message: 'Thiếu id_account' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng chọn ảnh avatar' });
    }

    const avatar_url = `/uploads/avatars/${req.file.filename}`;

    const updatedUser = await User.updateAvatar(id_account, avatar_url);

    if (!updatedUser) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(404).json({ message: 'Không tìm thấy profile user' });
    }

    res.json({
      message: 'Cập nhật avatar thành công',
      user: {
        id_user: updatedUser.id_user,
        id_account: updatedUser.id_account,
        avatar_url: updatedUser.avatar_url,
        name: updatedUser.name,
        status: updatedUser.status,
        language: updatedUser.language, 
      },
    });
  } catch (err) {
    console.error(err);
    if (req.file) await fs.unlink(req.file.path).catch(() => {});
    res.status(500).json({ message: 'Lỗi server khi cập nhật avatar' });
  }
};

module.exports = { updateProfile, getProfile, softDeleteUser, updateUserInfo, updateAvatar };