const ScanHistory = require('../models/scanHistoryModel');

const getAllScanHistories = async (req, res) => {
  try {
    const histories = await ScanHistory.getAll();

    res.json({
      message: 'Lấy toàn bộ lịch sử quét thành công',
      count: histories.length,
      data: histories,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi lấy lịch sử quét' });
  }
};

const getScanHistoryById = async (req, res) => {
  try {
    const { id_user, id_restaurant } = req.params;

    if (!id_user || !id_restaurant) {
      return res.status(400).json({ message: 'Thiếu id_user hoặc id_restaurant' });
    }
    const record = await ScanHistory.getById(id_user, id_restaurant);

    if (!record) {
      return res.status(404).json({ 
        message: 'Không tìm thấy lịch sử quét này' 
      });
    }

    res.json({
      message: 'Lấy thông tin lịch sử quét thành công',
      data: record,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Bạn có thể thêm hàm getByUserId nếu frontend cần danh sách lịch sử của user
const getScanHistoryByUser = async (req, res) => {
  try {
    const { id_user } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    if (!id_user) {
      return res.status(400).json({ message: 'Thiếu id_user' });
    }
    const records = await ScanHistory.getByUserId(id_user, limit);

    res.json({
      message: 'Lấy lịch sử quét của người dùng thành công',
      count: records.length,
      data: records,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

const createScanHistory = async (req, res) => {
  try {
    const { id_user, id_restaurant, token_used = 50 } = req.body;

    if (!id_user || !id_restaurant) {
      return res.status(400).json({ message: 'Thiếu id_user hoặc id_restaurant' });
    }

    const exists = await ScanHistory.exists(id_user, id_restaurant);

    let record;
    if (exists) {
      record = await ScanHistory.update(id_user, id_restaurant, token_used);
      message = 'Cập nhật lịch sử quét thành công';
    } else {
      record = await ScanHistory.insert(id_user, id_restaurant, token_used);
      message = 'Tạo mới lịch sử quét thành công';
    }

    res.status(200).json({
      message,
      data: record,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = {
  getAllScanHistories,
  getScanHistoryById,
  getScanHistoryByUser,
  createScanHistory,   // ← nên có endpoint này
};