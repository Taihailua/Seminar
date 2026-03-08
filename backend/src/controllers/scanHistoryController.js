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

module.exports = {
  getAllScanHistories,
  getScanHistoryById,
  getScanHistoryByUser,   // ← nên có endpoint này
};