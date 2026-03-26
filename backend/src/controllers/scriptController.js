// controllers/scriptController.js
const Script = require('../models/scriptModel');
const { validationResult } = require('express-validator');

const createScript = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, id_restaurant } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Nội dung script là bắt buộc' });
    }

    if (!id_restaurant) {
      return res.status(400).json({ message: 'id_restaurant là bắt buộc khi tạo script' });
    }

    const newScript = await Script.create({ 
      content: content.trim(), 
      id_restaurant 
    });

    res.status(201).json({
      message: 'Tạo script thành công và đã liên kết với nhà hàng',
      script: newScript
    });
  } catch (err) {
    console.error('Lỗi tạo script:', err);
    res.status(500).json({ message: 'Lỗi server khi tạo script' });
  }
};

const updateScript = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id_script } = req.params;
    const { content } = req.body;

    if (!id_script) {
      return res.status(400).json({ message: 'Thiếu id_script' });
    }

    const existing = await Script.getById(id_script);
    if (!existing) {
      return res.status(404).json({ message: 'Không tìm thấy script' });
    }

    const updatedScript = await Script.update(id_script, { content });

    res.json({
      message: 'Cập nhật script thành công',
      script: updatedScript
    });
  } catch (err) {
    console.error('Lỗi cập nhật script:', err);
    res.status(500).json({ message: 'Lỗi server khi cập nhật script' });
  }
};

const softDeleteScript = async (req, res) => {
  try {
    const { id_script } = req.params;

    if (!id_script) {
      return res.status(400).json({ message: 'Thiếu id_script' });
    }

    const existing = await Script.getById(id_script);
    if (!existing) {
      return res.status(404).json({ message: 'Không tìm thấy script' });
    }

    const deletedScript = await Script.softDelete(id_script);

    res.json({
      message: 'Xóa mềm script thành công (status = deleted)',
      script: deletedScript
    });
  } catch (err) {
    console.error('Lỗi xóa mềm script:', err);
    res.status(500).json({ message: 'Lỗi server khi xóa script' });
  }
};

const getAllScripts = async (req, res) => {
  try {
    const scripts = await Script.getAll();

    res.json({
      message: 'Lấy danh sách script thành công',
      count: scripts.length,
      scripts
    });
  } catch (err) {
    console.error('Lỗi lấy danh sách script:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách script' });
  }
};

const getScriptById = async (req, res) => {
  try {
    const { id_script } = req.params;

    if (!id_script) {
      return res.status(400).json({ message: 'Thiếu id_script' });
    }

    const script = await Script.getById(id_script);

    if (!script) {
      return res.status(404).json({ message: 'Không tìm thấy script' });
    }

    res.json({
      message: 'Lấy thông tin script thành công',
      script
    });
  } catch (err) {
    console.error('Lỗi lấy script:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin script' });
  }
};

module.exports = {
  createScript,
  updateScript,
  softDeleteScript,
  getAllScripts,
  getScriptById
};